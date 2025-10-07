
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;
let db: Firestore | undefined;

// Firebase App Hosting and other modern environments automatically provide
// the necessary configuration via environment variables (process.env).
// This simplified approach relies on that standard behavior, removing the need
// for manual file path resolution and making the initialization more robust.
// https://firebase.google.com/docs/hosting/app-hosting/build-run-sdks#initialize-sdks
try {
    if (!getApps().length) {
        adminApp = initializeApp();
    } else {
        adminApp = getApps()[0];
    }
    db = getFirestore(adminApp);
} catch (error) {
    console.error(
        "[Firebase Admin] SDK initialization failed.", 
        "This is likely because the service account credentials are not configured correctly in the environment.",
        "Error:", error
    );
    // db remains undefined, and API routes using it will fail.
}

export { adminApp, db };
