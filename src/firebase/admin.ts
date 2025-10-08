import * as admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

// Only initialize if all credentials are provided
if (projectId && clientEmail && privateKey && !admin.apps.length) {
  const serviceAccount = {
    projectId: projectId,
    clientEmail: clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${projectId}.firebaseio.com`,
  });
}

// Conditionally export db and auth to avoid errors when not initialized
let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;

if (admin.apps.length) {
  db = admin.firestore();
  auth = admin.auth();
}

// @ts-ignore
export { db, auth };
