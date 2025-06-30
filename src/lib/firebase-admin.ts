
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
    const missingVars = [];
    if (!process.env.FIREBASE_PROJECT_ID) missingVars.push('FIREBASE_PROJECT_ID');
    if (!process.env.FIREBASE_CLIENT_EMAIL) missingVars.push('FIREBASE_CLIENT_EMAIL');
    if (!process.env.FIREBASE_PRIVATE_KEY) missingVars.push('FIREBASE_PRIVATE_KEY');
    console.error(`CRITICAL ERROR: Firebase Admin SDK initialization failed. The following environment variables are missing on your Vercel deployment: ${missingVars.join(', ')}. The webhook API will not work without them.`);
  }
}

// These exports will now only run after the initialization block.
// If initialization fails, they will throw an error when used, which is the expected behavior.
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
