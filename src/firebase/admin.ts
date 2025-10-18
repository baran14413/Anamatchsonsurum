
import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';
import { serviceAccount } from './service-account';

// This function ensures Firebase is initialized only once.
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: `${serviceAccount.project_id}.appspot.com`
    });
}

const db: Firestore = getFirestore();
const auth: Auth = getAuth();
const storage: Storage = getStorage();

export { admin, db, auth, storage };
