import * as admin from 'firebase-admin';

// App Hosting provides the GOOGLE_APPLICATION_CREDENTIALS environment variable
// which is a path to a service account key file.
const serviceAccount = process.env.FIREBASE_PRIVATE_KEY
  ? {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }
  : undefined;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
