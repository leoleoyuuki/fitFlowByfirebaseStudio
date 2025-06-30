
import admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

// This setup is designed for Vercel. It expects environment variables
// for the service account credentials.
const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // The private key needs to be parsed correctly from the environment variable.
  // Vercel escapes newlines, so we need to replace \\n with \n.
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  try {
    // Check if all required service account properties are present
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin SDK Initialized successfully.');
    } else {
        console.warn('Firebase Admin SDK not initialized: Missing environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).');
    }
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.stack);
  }
}

// Export the admin db instance. Note: this might be an uninitialized app if env vars are missing.
// The code using it should handle this possibility if necessary.
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
