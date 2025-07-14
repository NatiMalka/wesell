import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  deleteDoc 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      console.log('🔐 Auth state changed:', firebaseUser?.uid);
      
      if (firebaseUser) {
        try {
          // Get user profile from Firestore with retry mechanism
          console.log('📖 Fetching user profile from Firestore...');
          
          let userDoc;
          let retryCount = 0;
          const maxRetries = 3;
          
          // Retry mechanism for race condition between auth user creation and Firestore document creation
          while (retryCount < maxRetries) {
            userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            
            if (userDoc.exists()) {
              break; // Profile found, exit retry loop
            }
            
            retryCount++;
            console.log(`🔄 User profile not found, retrying... (${retryCount}/${maxRetries})`);
            
            if (retryCount < maxRetries) {
              // Wait 1 second before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
          if (userDoc && userDoc.exists()) {
            const userData = userDoc.data();
            console.log('👤 User data from Firestore:', userData);
            
            const userProfile = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData.name || '',
              phone: userData.phone || '',
              role: userData.role || 'agent',
              teamId: userData.teamId || '',
              createdAt: userData.createdAt?.toDate() || new Date(),
            };
            
            console.log('✅ Setting user profile:', userProfile);
            setUser(userProfile);
          } else {
            console.log('❌ User profile not found in Firestore after retries');
            // User doesn't exist in Firestore, sign out
            await signOut(auth);
            setUser(null);
          }
        } catch (error) {
          console.error('❌ Error fetching user data:', error);
          setUser(null);
        }
      } else {
        console.log('🚪 User signed out');
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      // First, try to sign in with existing Firebase Auth user
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        // Get user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (!userDoc.exists()) {
          // User exists in Firebase Auth but not in our system
          await signOut(auth);
          throw new Error('המשתמש אינו קיים במערכת. אנא פנה למנהל הצוות');
        }
        
        const userData = userDoc.data();
        const userProfile: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: userData.name || '',
          phone: userData.phone || '',
          role: userData.role || 'agent',
          teamId: userData.teamId || '',
          createdAt: userData.createdAt?.toDate() || new Date(),
        };
        
        return userProfile;
      } catch (authError: any) {
        // Handle specific Firebase Auth errors
        console.log('🔍 Firebase Auth login failed:', authError.code, authError.message);
        
        // Check for pending user in both user-not-found AND invalid-credential cases
        // This handles cases where Firebase Auth user exists but password doesn't match our pending users
        if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
          // Check if this is a pending user (first-time login)
          console.log('🔍 Checking for pending user with these credentials...');
          
          const pendingUsersQuery = query(
            collection(db, 'pendingUsers'),
            where('email', '==', email),
            where('password', '==', password)
          );
          
          const pendingSnapshot = await getDocs(pendingUsersQuery);
          console.log('📊 Pending users found:', pendingSnapshot.size);
          
          if (!pendingSnapshot.empty) {
            // Found pending user - proceed with account activation
            const pendingUserDoc = pendingSnapshot.docs[0];
            const pendingUserId = pendingUserDoc.id;
            
            console.log('✅ Found pending user, creating/updating Firebase Auth user...');
            
            try {
              // Try to create Firebase Auth user
              const userCredential = await createUserWithEmailAndPassword(auth, email, password);
              const firebaseUser = userCredential.user;
              
              console.log('✅ Created new Firebase Auth user:', firebaseUser.uid);
              
              // Get the existing user profile from Firestore
              const userDoc = await getDoc(doc(db, 'users', pendingUserId));
              
              if (!userDoc.exists()) {
                throw new Error('פרופיל המשתמש לא נמצא');
              }
              
              const userData = userDoc.data();
              
              // Create new user profile with Firebase Auth UID
              const updatedUserProfile = {
                ...userData,
                id: firebaseUser.uid,
                createdAt: userData.createdAt || new Date(),
              };
              
              // Store user profile with Firebase Auth UID
              await setDoc(doc(db, 'users', firebaseUser.uid), updatedUserProfile);
              
              // Delete old user profile and pending user
              await Promise.all([
                deleteDoc(doc(db, 'users', pendingUserId)),
                deleteDoc(doc(db, 'pendingUsers', pendingUserId))
              ]);
              
              console.log('✅ Successfully migrated pending user to Firebase Auth');
              
              const userProfile: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: userData.name || '',
                phone: userData.phone || '',
                role: userData.role || 'agent',
                teamId: userData.teamId || '',
                createdAt: userData.createdAt?.toDate() || new Date(),
              };
              
              return userProfile;
            } catch (createError: any) {
              // If user creation fails because email is already in use
              if (createError.code === 'auth/email-already-in-use') {
                console.log('🔄 Firebase Auth user already exists, attempting to update password...');
                
                // There's an existing Firebase Auth user, but they're not in our Firestore users collection
                // This could happen if the agent was deleted but Firebase Auth user wasn't cleaned up
                // We'll try to sign in with different methods or suggest password reset
                
                throw new Error(`המשתמש ${email} כבר קיים במערכת Firebase אך לא מחובר למערכת שלנו. אנא פנה למנהל הצוות לפתרון הבעיה.`);
              } else {
                throw createError;
              }
            }
          } else {
            // No pending user found
            console.log('❌ No pending user found with these credentials');
            
            if (authError.code === 'auth/user-not-found') {
              throw new Error('המשתמש אינו קיים במערכת. אנא פנה למנהל הצוות');
            } else {
              // auth/invalid-credential but no pending user - could be wrong password for existing user
              throw new Error('סיסמה שגויה. אנא בדוק את הסיסמה שלך ונסה שוב');
            }
          }
        } else if (authError.code === 'auth/wrong-password') {
          // Wrong password for existing Firebase Auth user
          throw new Error('סיסמה שגויה. אנא בדוק את הסיסמה שלך ונסה שוב');
        } else if (authError.code === 'auth/invalid-email') {
          // Invalid email format
          throw new Error('כתובת אימייל לא תקינה. אנא בדוק את כתובת האימייל שלך');
        } else if (authError.code === 'auth/too-many-requests') {
          // Too many failed attempts
          throw new Error('יותר מדי נסיונות התחברות כושלים. אנא המתן מספר דקות ונסה שוב');
        } else if (authError.code === 'auth/user-disabled') {
          // User account disabled
          throw new Error('החשבון שלך הושבת. אנא פנה למנהל הצוות');
        } else if (authError.code === 'auth/network-request-failed') {
          // Network error
          throw new Error('בעיית קישוריות לרשת. אנא בדוק את החיבור לאינטרנט ונסה שוב');
        } else {
          // Generic error - but check if message contains useful info
          if (authError.message && authError.message.includes('המשתמש אינו קיים במערכת')) {
            throw authError; // Re-throw our custom message
          }
          throw new Error('שגיאה בהתחברות. אנא נסה שוב או פנה למנהל הצוות');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Re-throw custom errors as-is
      if (error.message && (
        error.message.includes('המשתמש אינו קיים במערכת') ||
        error.message.includes('סיסמה שגויה') ||
        error.message.includes('כתובת אימייל לא תקינה') ||
        error.message.includes('יותר מדי נסיונות') ||
        error.message.includes('החשבון שלך הושבת') ||
        error.message.includes('בעיית קישוריות') ||
        error.message.includes('כבר קיים במערכת Firebase')
      )) {
        throw error;
      }
      
      // Handle any other Firebase errors that might have been missed
      if (error.code === 'auth/user-not-found') {
        throw new Error('המשתמש אינו קיים במערכת. אנא פנה למנהל הצוות');
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('סיסמה שגויה. אנא בדוק את הסיסמה שלך ונסה שוב');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('כתובת אימייל לא תקינה. אנא בדוק את כתובת האימייל שלך');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('יותר מדי נסיונות התחברות כושלים. אנא המתן מספר דקות ונסה שוב');
      } else if (error.code === 'auth/email-already-in-use') {
        throw new Error('כתובת האימייל כבר בשימוש');
      } else {
        // Final fallback
        throw new Error('שגיאה בהתחברות. אנא נסה שוב או פנה למנהל הצוות');
      }
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Create a new user (for team managers to create agents)
  const createUser = async (userData: {
    email: string;
    password: string;
    name: string;
    phone: string;
    role: 'agent' | 'manager';
    teamId?: string;
  }): Promise<User> => {
    try {
      console.log('🔧 Creating new user:', userData.email);
      console.log('📋 User data:', userData);
      
      // Generate a unique user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create user profile in Firestore
      const newUser: User = {
        id: userId,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        teamId: userData.teamId || '',
        createdAt: new Date(),
      };
      
      console.log('👤 Creating user profile in Firestore:', newUser);
      
      // Store user profile in Firestore
      await setDoc(doc(db, 'users', userId), {
        ...newUser,
        createdAt: new Date(),
      });
      
      // Store login credentials separately (will be used to create Firebase Auth user on first login)
      await setDoc(doc(db, 'pendingUsers', userId), {
        email: userData.email,
        password: userData.password,
        createdAt: new Date(),
      });
      
      console.log('✅ User profile created in Firestore:', newUser);
      
      // Verify the user was created by reading it back
      const createdUserDoc = await getDoc(doc(db, 'users', userId));
      if (createdUserDoc.exists()) {
        console.log('🔍 Verification: User exists in Firestore:', createdUserDoc.data());
      } else {
        console.log('❌ Verification: User NOT found in Firestore');
    }
      
      return newUser;
    } catch (error: any) {
      console.error('Error creating user:', error);
      throw new Error('שגיאה ביצירת המשתמש');
    }
  };

  // Get team members (for team managers)
  const getTeamMembers = async (teamId: string): Promise<User[]> => {
    try {
      const q = query(
        collection(db, 'users'),
        where('teamId', '==', teamId),
        where('role', '==', 'agent')
      );
      
      const querySnapshot = await getDocs(q);
      const members: User[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        members.push({
          id: doc.id,
          email: data.email || '',
          name: data.name || '',
          phone: data.phone || '',
          role: data.role || 'agent',
          teamId: data.teamId || '',
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });
      
      return members;
    } catch (error) {
      console.error('Error getting team members:', error);
      throw new Error('שגיאה בטעינת חברי הצוות');
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    createUser,
    getTeamMembers,
  };
};