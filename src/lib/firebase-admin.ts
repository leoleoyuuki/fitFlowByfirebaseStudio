
import admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

// Check if the app is already initialized to avoid errors
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      const serviceAccount: ServiceAccount = {
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      };
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK Initialized successfully.');
    } catch (error: any) {
      console.error('Firebase admin initialization error:', error.stack);
    }
  } else {
    console.error('Firebase Admin SDK environment variables are missing. Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY. The webhook API will not work.');
  }
}

// These exports will now only run after the initialization block.
// If initialization fails, they will throw an error when used, which is the expected behavior.
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
