import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';

// Function to safely parse the service account from Base64
function getServiceAccount() {
    const base64ServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!base64ServiceAccount) {
        // In a serverless environment (like Vercel), env vars might not be available at build time.
        // We throw an error only if we're clearly in a runtime environment where it's missing.
        if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set.');
        }
        return null;
    }
    try {
        const decodedString = Buffer.from(base64ServiceAccount, 'base64').toString('utf-8');
        return JSON.parse(decodedString);
    } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64.", e);
        return null;
    }
}


// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
    const serviceAccount = getServiceAccount();
    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: `${serviceAccount.project_id}.appspot.com`
        });
    } else {
        // If service account is not available (e.g. during build), we might skip initialization.
        // The API routes will fail at runtime if the env var is not correctly set.
        console.warn("Firebase Admin SDK not initialized. This is expected during build, but will cause errors at runtime if the service account environment variable is missing.");
    }
}

// Export initialized services. They will throw an error at runtime if the SDK was not initialized.
const db: Firestore = getFirestore();
const auth: Auth = getAuth();
const storage: Storage = getStorage();

export { admin, db, auth, storage };