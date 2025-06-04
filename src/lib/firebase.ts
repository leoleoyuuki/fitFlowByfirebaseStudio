
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Added Firestore import
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDScdZ1qIT3I9sGMOtvnGYrMAnQ-W-02ZM",
  authDomain: "saas-fitness1.firebaseapp.com",
  projectId: "saas-fitness1",
  storageBucket: "saas-fitness1.firebasestorage.app",
  messagingSenderId: "593509228481",
  appId: "1:593509228481:web:c01b1664df9a0fd8b19940"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);
export const db = getFirestore(app); // Export Firestore instance
export default app;

