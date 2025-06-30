
import admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

// Check if the app is already initialized to avoid errors
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    // Log key details for debugging in production without exposing the full key.
    console.log('Firebase Admin Init: Attempting to initialize...');
    console.log(`Firebase Admin Init: Key starts with "${formattedPrivateKey.substring(0, 35)}..."`);
    console.log(`Firebase Admin Init: Key ends with "...${formattedPrivateKey.substring(formattedPrivateKey.length - 35)}"`);
    
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
        console.error('DECODER ERROR HINT: This error almost always means the FIREBASE_PRIVATE_KEY is corrupted or incorrectly formatted in your Vercel environment variables. Please re-copy the entire key from your Firebase service account JSON file into Vercel.');
      }
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
