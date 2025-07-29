import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK with environment variables (server-side only)
// These variables are ONLY accessible on the server and never exposed to the client

// Check if app is already initialized to prevent multiple initializations
let firebaseAdmin: admin.app.App | null = null;
let isFirebaseConfigured = false;

if (!admin.apps.length) {
  try {
    // Check if we have the required Firebase Admin credentials
    const privateKey = process.env.FIREBASE_PRIVATE_KEY 
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
      : undefined;
    
    if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.warn('Firebase Admin SDK credentials not configured. Google authentication will not work.');
      isFirebaseConfigured = false;
    } else {
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
      isFirebaseConfigured = true;
      console.log('Firebase Admin SDK initialized successfully');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    console.log('Google authentication will be disabled. Please configure Firebase Admin SDK credentials.');
    isFirebaseConfigured = false;
  }
} else {
  firebaseAdmin = admin.app();
  isFirebaseConfigured = true;
}

// Export the Firebase Admin services only if configured
export const auth = isFirebaseConfigured && firebaseAdmin ? getAuth(firebaseAdmin) : null;
export const db = isFirebaseConfigured && firebaseAdmin ? getFirestore(firebaseAdmin) : null;

/**
 * Verify Firebase ID token and get user data
 * @param idToken The Firebase ID token to verify
 * @returns User data from the verified token
 */
export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  try {
    if (!auth) {
      throw new Error('Firebase Admin SDK not configured');
    }
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification error:', error);
    throw new Error('Invalid Firebase token');
  }
}

/**
 * Get Firebase user by UID
 * @param uid User ID from Firebase
 * @returns Firebase user record
 */
export async function getFirebaseUser(uid: string) {
  try {
    if (!auth) {
      throw new Error('Firebase Admin SDK not configured');
    }
    const userRecord = await auth.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Firebase get user error:', error);
    throw new Error('User not found in Firebase');
  }
}

/**
 * Create a custom token for Firebase authentication
 * @param uid User ID to create token for
 * @param additionalClaims Optional additional claims to include in the token
 * @returns Custom Firebase token
 */
export async function createCustomToken(uid: string, additionalClaims?: Record<string, any>) {
  try {
    if (!auth) {
      throw new Error('Firebase Admin SDK not configured');
    }
    const customToken = await auth.createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    console.error('Firebase custom token creation error:', error);
    throw new Error('Failed to create custom token');
  }
}

export default firebaseAdmin;
