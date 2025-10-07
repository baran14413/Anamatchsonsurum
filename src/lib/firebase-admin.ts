
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App;
let db: Firestore;
let adminAuth: Auth;

// In a managed environment like Firebase App Hosting, initializeApp() with no arguments 
// will automatically discover the credentials. This is the recommended practice.
// https://firebase.google.com/docs/admin/setup#initialize-sdk
try {
    if (!getApps().length) {
        adminApp = initializeApp();
    } else {
        adminApp = getApps()[0];
    }
    
    db = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);

} catch (error: any) {
    // If initialization fails, log a detailed error and fail fast.
    // This is critical for diagnosing environment configuration issues.
    console.error(
        "CRITICAL: Firebase Admin SDK initialization failed. \n" +
        "This is likely due to a misconfigured or missing service account with insufficient IAM permissions in the runtime environment.\n" +
        "Ensure the service account for this backend has 'Firebase Authentication Admin', 'Cloud Datastore User', and 'Service Account Token Creator' roles.\n" +
        "Error Details:", error.message
    );
    // Re-throwing the error to prevent the server from starting in a broken state.
    throw new Error(`Firebase Admin SDK failed to initialize: ${error.message}`);
}

export { adminApp, db, adminAuth };
