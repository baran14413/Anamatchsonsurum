import * as admin from 'firebase-admin';

// This function attempts to parse the service account JSON from the environment variable.
// It includes more robust error handling.
const parseServiceAccount = () => {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccountJson) {
        console.error("Firebase Admin Error: FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
        throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
    }
    
    try {
        return JSON.parse(serviceAccountJson);
    } catch (e: any) {
        console.error("Firebase Admin Error: Failed to parse FIREBASE_SERVICE_ACCOUNT JSON.", e.message);
        throw new Error("Failed to parse FIREBASE_SERVICE_ACCOUNT. Check the format.");
    }
};

// Initialize Firebase Admin SDK only if it hasn't been initialized yet.
if (!admin.apps.length) {
    try {
        const serviceAccount = parseServiceAccount();
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error) {
        // Log the initialization error but don't re-throw,
        // as this might run in environments where it's expected to fail if not configured.
        console.error("Firebase Admin SDK initialization failed:", error);
    }
}

// Export the admin database and auth instances.
// These will throw an error at runtime if initialization failed and they are used.
export const adminDb = admin.apps.length > 0 ? admin.firestore() : null!;
export const adminAuth = admin.apps.length > 0 ? admin.auth() : null!;
