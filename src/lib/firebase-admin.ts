
import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App;
let db: Firestore;
let adminAuth: Auth;

try {
    if (!getApps().length) {
        // When deployed to App Hosting, initializeApp() with no arguments 
        // will automatically use the credentials of the underlying service account.
        adminApp = initializeApp();
    } else {
        adminApp = getApps()[0];
    }
    db = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);
} catch (error: any) {
    console.error(
        "CRITICAL: Firebase Admin SDK initialization failed.",
        "This is likely due to missing or incorrect service account credentials or permissions in the execution environment.",
        "Ensure the service account has 'Firebase Settings Admin' or 'Firebase Admin' roles.",
        "Error Details:", error.message
    );
    // Re-throw to fail fast. The server process should not start if the admin SDK fails.
    throw new Error(`Firebase Admin SDK failed to initialize: ${error.message}`);
}

export { adminApp, db, adminAuth };
