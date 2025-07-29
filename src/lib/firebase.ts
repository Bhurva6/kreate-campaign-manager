// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug Firebase configuration
console.log('Firebase Config:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

// Validate required config
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  throw new Error('Missing required Firebase configuration. Please check your environment variables.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Configure Google Provider with specific parameters
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Add required scopes
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.addScope('openid');

// Phone Auth utilities
export { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  PhoneAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
};

export default app;
