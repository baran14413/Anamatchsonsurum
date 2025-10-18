
import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';

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

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error("Firebase Admin SDK environment variables are not set. Cannot initialize.");
    }
    
    const serviceAccount: admin.ServiceAccount = {
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
    };
    
    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: `${projectId}.appspot.com`,
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
