
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Re-export admin itself to be used in other files if needed
export { admin };

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

// Only initialize if all credentials are provided and no apps are initialized yet
if (projectId && clientEmail && privateKey && !admin.apps.length) {
  try {
    const serviceAccount = {
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: `${projectId}.appspot.com`, 
    });

  } catch (error: any) {
    console.error("Firebase Admin Initialization Error:", error.message);
  }
}

// Conditionally export db, auth, and storage to avoid errors when not initialized.
// Use getters to ensure services are retrieved from the initialized app.
let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;
let storage: admin.storage.Storage;

if (admin.apps.length > 0) {
  db = getFirestore();
  auth = getAuth();
  storage = getStorage();
}

// @ts-ignore
export { db, auth, storage };
