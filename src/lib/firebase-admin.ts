
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App;
let db: Firestore;
let adminAuth: Auth;

// This logic is designed to work robustly in a managed Google Cloud environment
// like Firebase App Hosting or Cloud Run.
try {
    if (!getApps().length) {
        // In a managed environment, initializeApp() with no arguments automatically
        // discovers and uses the project's default service account credentials.
        // This is the standard and recommended practice.
        adminApp = initializeApp();
    } else {
        // If already initialized, get the existing app.
        adminApp = getApps()[0];
    }
    
    db = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);

} catch (error: any) {
    // If initialization fails, it's a critical failure of the environment's configuration.
    // Log a detailed error and re-throw to cause a server crash, which makes the
    // problem immediately visible in logs.
    console.error(
        "CRITICAL: Firebase Admin SDK initialization failed.",
        "This is likely due to a misconfigured or missing service account with insufficient IAM permissions in the runtime environment.",
        "Ensure the service account for this backend has 'Firebase Authentication Admin' and 'Cloud Datastore User' roles.",
        "Error Details:", error.message
    );
    // Fail fast. The server process should not continue if it cannot connect to Firebase.
    throw new Error(`Firebase Admin SDK failed to initialize: ${error.message}`);
}

// Export the initialized and ready-to-use services.
export { adminApp, db, adminAuth };
