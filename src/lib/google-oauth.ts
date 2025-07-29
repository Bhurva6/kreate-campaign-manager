/**
 * Firebase Google OAuth integration for client-side authentication
 * Simplified and focused implementation for Google Sign-In
 */

import { auth, googleProvider } from './firebase';
import { signInWithPopup, AuthError, User } from 'firebase/auth';

export interface GoogleAuthResult {
  success: boolean;
  user?: {
    accessToken: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
      isEmailVerified: boolean;
      provider: string;
    };
    isNewUser?: boolean;
  };
  error?: string;
}

/**
 * Sign in with Google using Firebase popup
 */
export const signInWithGooglePopup = async (): Promise<GoogleAuthResult> => {
  try {
    console.log('Attempting Google Sign In...');
    
    // Check if auth is properly initialized
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }

    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    console.log('Google Sign In successful:', user.email);
    
    // Get ID token for backend verification
    const idToken = await user.getIdToken();
    
    // Send token to backend for secure verification and JWT creation
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: idToken }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to authenticate with server');
      }
      
      return {
        success: true,
        user: data.data // Return the full backend response which includes accessToken and user object
      };
    } catch (serverError) {
      console.error('Server authentication error:', serverError);
      return {
        success: false,
        error: serverError instanceof Error ? serverError.message : 'Server authentication failed',
      };
    }
  } catch (error) {
    console.error('Google Sign In error:', error);
    
    const authError = error as AuthError;
    let errorMessage = 'Authentication failed';
    
    switch (authError.code) {
      case 'auth/configuration-not-found':
        errorMessage = 'Firebase configuration is missing or invalid. Please check your Firebase settings.';
        break;
      case 'auth/popup-closed-by-user':
        errorMessage = 'Sign-in popup was closed before completing authentication.';
        break;
      case 'auth/popup-blocked':
        errorMessage = 'Sign-in popup was blocked by the browser. Please allow popups for this site.';
        break;
      case 'auth/cancelled-popup-request':
        errorMessage = 'Sign-in was cancelled. Please try again.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error occurred. Please check your internet connection.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed attempts. Please try again later.';
        break;
      default:
        errorMessage = authError.message || 'An unexpected error occurred during authentication.';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Legacy compatibility function
 */
export const initializeGoogleOAuth = async (
  clientId: string,
  onCredentialResponse: (credential: string) => void
): Promise<void> => {
  try {
    const result = await signInWithGooglePopup();
    if (result.success && result.user) {
      onCredentialResponse(result.user.accessToken);
    } else {
      throw new Error(result.error || 'Authentication failed');
    }
  } catch (error) {
    console.error('Failed to initialize Google OAuth:', error);
    throw error;
  }
};
