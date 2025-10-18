
import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';
import serviceAccountKey from '@/service-account-key.json';

// Re-export admin itself to be used in other files if needed
export { admin };

interface AdminServices {
    db: Firestore;
    auth: Auth;
    storage: Storage;
}

// This function ensures Firebase is initialized only once.
function initializeAdminApp(): admin.app.App {
    if (admin.apps.length > 0) {
        return admin.apps[0]!;
    }
    
    // Type assertion to match the structure of ServiceAccount
    const serviceAccount = serviceAccountKey as admin.ServiceAccount;

    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "bematch-new.firebasestorage.app",
    });
}

// A lazy-getter to ensure services are retrieved from an initialized app.
export function getAdminServices(): AdminServices {
    const app = initializeAdminApp();
    return {
        db: getFirestore(app),
        auth: getAuth(app),
        storage: getStorage(app),
    };
}
