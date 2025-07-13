import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBIQjtvG-Jkch6L7V0DAL8FHvsloYTZmME",
  authDomain: "wesell-870cd.firebaseapp.com",
  projectId: "wesell-870cd",
  storageBucket: "wesell-870cd.firebasestorage.app",
  messagingSenderId: "846245360695",
  appId: "1:846245360695:web:9bddf23b894a1dd0607bb2",
  measurementId: "G-EC0WF1744Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;