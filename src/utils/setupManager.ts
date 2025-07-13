import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection } from 'firebase/firestore';
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
    
    await setDoc(doc(db, 'users', user.uid), userData);
    console.log('User profile created in Firestore');
    
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

// Helper function to run from browser console
export const setupManager = () => {
  const email = prompt('Enter manager email:') || 'manager@wesell.com';
  const password = prompt('Enter manager password:') || 'WeSell123!';
  const name = prompt('Enter manager name:') || 'מנהל ראשי';
  const phone = prompt('Enter manager phone:') || '050-1234567';
  
  return createInitialManager(email, password, name, phone);
}; 