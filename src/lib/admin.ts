import "server-only";
import * as admin from 'firebase-admin';

// Ensure the service account JSON string is correctly parsed from the environment variable.
// It might need to be base64 decoded if it's encoded.
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

let serviceAccount: admin.ServiceAccount;

if (!serviceAccountString) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
}

try {
    serviceAccount = JSON.parse(serviceAccountString);
} catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT. Make sure it's a valid JSON string.", e);
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT format.");
}


if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e) {
    console.error('Firebase Admin initialization error', e);
    // Propagate the error to make it visible during build/runtime
    throw new Error("Could not initialize Firebase Admin SDK.");
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
