import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';

// Ensure this file is only run on the server
if (typeof window !== 'undefined') {
  throw new Error('Firebase Admin SDK must only be used on the server.');
}

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
      });
    } else {
        // This will rely on Google Application Default Credentials
        // This is useful for environments like Google Cloud Run
        console.log("Initializing Firebase Admin SDK with Application Default Credentials.");
        admin.initializeApp({
            storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
        });
    }
  } catch (e: any) {
    console.error('Firebase Admin SDK Initialization Error:', e.stack);
  }
}

const db: Firestore = getFirestore();
const auth: Auth = getAuth();
const storage: Storage = getStorage();

export { admin, db, auth, storage };