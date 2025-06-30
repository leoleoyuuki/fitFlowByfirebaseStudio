
import admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

// Check if the app is already initialized to avoid errors
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    // This line is the key fix. It replaces the escaped newlines `\\n`
    // that Vercel and other platforms sometimes create with the actual
    // newline character `\n` that the Firebase SDK expects.
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    try {
      const serviceAccount: ServiceAccount = {
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      };
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK Initialized successfully.');
    } catch (error: any) {
      console.error('CRITICAL: Firebase admin initialization failed.', error);
      if (error.message && error.message.includes('DECODER routines')) {
        console.error('DECODER ERROR HINT: This error often means the FIREBASE_PRIVATE_KEY is corrupted or incorrectly formatted in your environment variables. Please re-copy the entire key from your Firebase service account JSON file.');
      }
    }
  } else {
    const missingVars = [];
    if (!process.env.FIREBASE_PROJECT_ID) missingVars.push('FIREBASE_PROJECT_ID');
    if (!process.env.FIREBASE_CLIENT_EMAIL) missingVars.push('FIREBASE_CLIENT_EMAIL');
    if (!process.env.FIREBASE_PRIVATE_KEY) missingVars.push('FIREBASE_PRIVATE_KEY');
    console.error(`CRITICAL ERROR: Firebase Admin SDK initialization failed. The following environment variables are missing: ${missingVars.join(', ')}. The webhook API will not work without them.`);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
