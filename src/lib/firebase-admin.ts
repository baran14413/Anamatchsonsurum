
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App;
let db: Firestore;
let adminAuth: Auth;

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
        "CRITICAL: Firebase Admin SDK initialization failed. This is likely due to a misconfigured or missing service account. Error Details:", error.message
    );
    // In a real scenario, you might want to prevent the app from starting.
    // For this context, we allow db and adminAuth to be potentially undefined,
    // and API routes will have to handle this case.
}

export { adminApp, db, adminAuth };
