
import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';

// Ensure this file is only run on the server, though 'use server' directive handles this.
if (typeof window !== 'undefined') {
  throw new Error('Firebase Admin SDK must only be used on the server.');
}

// Service account credentials directly embedded
// In a real production app, use environment variables for security.
const serviceAccount = {
  "type": "service_account",
  "project_id": "bematch-new",
  "private_key_id": "bbb352263ad0285352972d472fe474ab26466962",
  "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  "client_email": "firebase-adminsdk-fbsvc@bematch-new.iam.gserviceaccount.com",
  "client_id": "112694597922821600578",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40bematch-new.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// Initialize Firebase Admin SDK only if it hasn't been initialized yet
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
      storageBucket: `${serviceAccount.project_id}.appspot.com`,
    });
  } catch (e: any) {
    console.error('Firebase Admin SDK Initialization Error:', e.stack);
  }
}

const db: Firestore = getFirestore();
const auth: Auth = getAuth();
const storage: Storage = getStorage();

export { admin, db, auth, storage };
