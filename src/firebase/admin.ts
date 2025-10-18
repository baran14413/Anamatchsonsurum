
import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';

// Re-export admin itself to be used in other files if needed
export { admin };

// This function ensures Firebase is initialized only once.
if (!admin.apps.length) {
    // App Hosting provides the configuration automatically.
    // initializeApp() will automatically use the GOOGLE_APPLICATION_CREDENTIALS
    // environment variable, which is set by the App Hosting runtime.
    admin.initializeApp();
}

const db: Firestore = getFirestore();
const auth: Auth = getAuth();
const storage: Storage = getStorage();

export { db, auth, storage };
