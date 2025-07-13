import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        try {
          // Get user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData.name || '',
              phone: userData.phone || '',
              role: userData.role || 'agent',
              teamId: userData.teamId || '',
              createdAt: userData.createdAt?.toDate() || new Date(),
            });
          } else {
            // User doesn't exist in Firestore, sign out
            await signOut(auth);
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        // User doesn't exist in Firestore
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
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new Error('משתמש לא נמצא');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('סיסמה שגויה');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('כתובת אימייל לא תקינה');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('יותר מדי נסיונות התחברות. נסה שוב מאוחר יותר');
      } else {
        throw new Error(error.message || 'שגיאה בהתחברות');
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
      // Create user profile in Firestore (without Firebase Auth user creation)
      // The user will be created by the manager and credentials will be shared
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newUser: User = {
        id: userId,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        teamId: userData.teamId || '',
        createdAt: new Date(),
      };
      
      // Store user profile in Firestore
      await setDoc(doc(db, 'users', userId), {
        ...newUser,
        password: userData.password, // Store temporarily for initial login
        createdAt: new Date(),
      });
      
      // Store login credentials separately
      await setDoc(doc(db, 'userCredentials', userId), {
        email: userData.email,
        password: userData.password,
        createdAt: new Date(),
      });
      
      return newUser;
    } catch (error) {
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