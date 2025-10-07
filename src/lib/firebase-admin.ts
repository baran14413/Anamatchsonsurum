
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;
let db: Firestore;

try {
    if (!getApps().length) {
        // When running in a Google Cloud environment (like Firebase App Hosting),
        // the Admin SDK can be initialized without any parameters. It will
        // automatically discover the service account credentials.
        adminApp = initializeApp();
    } else {
        adminApp = getApps()[0];
    }
    db = getFirestore(adminApp);
} catch (error: any) {
    console.error(
        "[Firebase Admin] SDK initialization failed.",
        "This is often due to missing or incorrect service account credentials in the server environment.",
        "Ensure that the FIREBASE_CONFIG or GOOGLE_APPLICATION_CREDENTIALS environment variables are set correctly.",
        "Error Details:", error.message
    );
    // In case of an initialization error, db will be undefined, and any API
    // route trying to use it will fail, which is the desired behavior.
    // We re-throw the error to make the server startup fail loudly.
    throw new Error(`Firebase Admin initialization failed: ${error.message}`);
}

export { adminApp, db };
