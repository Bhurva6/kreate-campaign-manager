# Firebase Setup Instructions

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "surreal-app")
4. Follow the setup wizard

## 2. Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click on "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Google" as a sign-in provider
5. Add your domain (localhost:3000 for development) to authorized domains

## 3. Get Firebase Configuration

1. Go to Project Settings (gear icon in the sidebar)
2. Scroll down to "Your apps" section
3. Click "Add app" and choose the web icon (</>)
4. Register your app with a nickname
5. Copy the config object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## 4. Update Environment Variables

1. Open `.env.local` in your project root
2. Replace the placeholder values with your actual Firebase config:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com  
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## 5. Test the Authentication

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "Sign In" or "Get Started Free"
4. Try signing in with Google

## Security Rules (Optional)

If you plan to use Firestore database later, set up security rules in the "Firestore Database" section of your Firebase console.

## Production Setup

When deploying to production:
1. Add your production domain to Firebase Auth authorized domains
2. Update the environment variables in your hosting platform
3. Consider setting up Firebase hosting for seamless integration
