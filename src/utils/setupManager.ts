import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const createInitialManager = async (
  email: string,
  password: string,
  name: string,
  phone: string
) => {
  try {
    console.log('Creating team manager...');
    
    // Step 1: Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('Firebase Auth user created:', user.uid);
    
    // Step 2: Create team
    const teamId = `team_${Date.now()}`;
    const teamData = {
      id: teamId,
      name: 'צוות מכירות ראשי',
      managerId: user.uid,
      agentIds: [],
      createdAt: new Date(),
    };
    
    await setDoc(doc(db, 'teams', teamId), teamData);
    console.log('Team created:', teamId);
    
    // Step 3: Create user profile in Firestore
    const userData = {
      id: user.uid,
      email: user.email,
      name,
      phone,
      role: 'manager',
      teamId,
      createdAt: new Date(),
    };
    
    console.log('📝 Creating user profile in Firestore...');
    await setDoc(doc(db, 'users', user.uid), userData);
    console.log('✅ User profile created in Firestore:', userData);
    
    // Add a small delay to ensure Firestore write is complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify the data was saved
    console.log('🔍 Verifying user profile in Firestore...');
    const savedUserDoc = await getDoc(doc(db, 'users', user.uid));
    if (savedUserDoc.exists()) {
      console.log('✅ Verified user profile in Firestore:', savedUserDoc.data());
    } else {
      console.log('❌ Failed to verify user profile in Firestore');
      throw new Error('Failed to create user profile in Firestore');
    }
    
    console.log('✅ Team manager setup complete!');
    console.log('Login details:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    return {
      userId: user.uid,
      teamId,
      email,
      name,
    };
    
  } catch (error) {
    console.error('Error creating team manager:', error);
    throw error;
  }
};

// Note: createInitialManager can be used programmatically for setting up initial managers
// in production, integrate this into your admin panel or initialization process 