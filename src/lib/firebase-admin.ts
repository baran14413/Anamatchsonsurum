
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App;
let db: Firestore;
let adminAuth: Auth;

try {
    if (!getApps().length) {
        // In a managed environment like Firebase App Hosting or Cloud Run, 
        // initializeApp() with no arguments will automatically discover credentials.
        adminApp = initializeApp();
    } else {
        adminApp = getApps()[0];
    }
    
    db = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);

} catch (error: any) {
    console.error(
        "CRITICAL: Firebase Admin SDK initialization failed.",
        "This is likely due to a misconfigured or missing service account with insufficient IAM permissions in the runtime environment.",
        "Ensure the service account for this backend has 'Firebase Authentication Admin' and 'Cloud Datastore User' roles.",
        "Error Details:", error.message
    );
    // Fail fast. The server process should not continue if it cannot connect to Firebase.
    throw new Error(`Firebase Admin SDK failed to initialize: ${error.message}`);
}

export { adminApp, db, adminAuth };
