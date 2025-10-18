
import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';
import getConfig from 'next/config';

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
    
    // Use Next.js runtime config to get server-side environment variables
    const { serverRuntimeConfig } = getConfig();

    const { 
        FIREBASE_PROJECT_ID: projectId, 
        FIREBASE_CLIENT_EMAIL: clientEmail, 
        FIREBASE_PRIVATE_KEY: privateKey 
    } = serverRuntimeConfig;


    if (!projectId || !clientEmail || !privateKey) {
        // This error should now be much less likely to occur.
        throw new Error("Firebase Admin SDK server runtime configuration is not set. Cannot initialize.");
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
