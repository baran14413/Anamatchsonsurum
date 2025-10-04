
"use server-only";
import * as admin from 'firebase-admin';
require('dotenv').config({ path: '.env' });


// This function ensures that the service account JSON is properly parsed,
// whether it's a raw string or base64 encoded.
function parseServiceAccount(): admin.ServiceAccount {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountString) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set. Please ensure your .env file is correctly set up.");
    }

    try {
        // First, try to parse it as a raw JSON string
        return JSON.parse(serviceAccountString);
    } catch (e) {
        // If that fails, assume it's base64 encoded
        try {
            const decodedString = Buffer.from(serviceAccountString, 'base64').toString('utf8');
            if (!decodedString) {
                 throw new Error("Base64 decoding resulted in an empty string.");
            }
            return JSON.parse(decodedString);
        } catch (e2: any) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT. It is not valid JSON or a valid base64-encoded JSON string.", e2.message);
            throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT format: ${e2.message}`);
        }
    }
}

if (!admin.apps.length) {
  try {
    const serviceAccount = parseServiceAccount();
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e: any) {
    console.error('Firebase Admin initialization error', e.message);
    // Propagate the error to make it visible during build/runtime
    throw new Error(`Could not initialize Firebase Admin SDK. Reason: ${e.message}`);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
