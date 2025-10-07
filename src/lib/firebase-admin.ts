
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App;
let db: Firestore;
let adminAuth: Auth;

// This setup is simplified and assumes the environment is correctly configured.
// It will throw an error on startup if credentials are not found,
// making debugging clearer.
try {
    if (!getApps().length) {
        adminApp = initializeApp();
    } else {
        adminApp = getApps()[0];
    }
    db = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);
} catch (error: any) {
    console.error(
        "CRITICAL: Firebase Admin SDK initialization failed.",
        "This is likely due to missing or incorrect service account credentials in the execution environment.",
        "Ensure GOOGLE_APPLICATION_CREDENTIALS is set or the environment has default credentials.",
        "Error Details:", error.message
    );
    // Re-throw to fail fast. The server process should not start if the admin SDK fails.
    throw error;
}

export { adminApp, db, adminAuth };
