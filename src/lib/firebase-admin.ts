
import admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };
    
    // This will throw an error if the credentials are not valid, which is what we want.
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK Initialized successfully.');
  } catch (error: any)
    // Log a more helpful error message.
    console.error('Firebase admin initialization error. Make sure your Firebase Admin SDK environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are set correctly in your .env file or Vercel environment.', error.stack);
  }
}

// These exports will now only run after the initialization block.
// If initialization fails, they will throw an error when used, which is the expected behavior.
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
