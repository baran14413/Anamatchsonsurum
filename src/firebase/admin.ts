
import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';

// This function ensures Firebase is initialized only once.
if (!admin.apps.length) {
    const privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64!, 'base64').toString('utf8');

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
        storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
    });
}

const db: Firestore = getFirestore();
const auth: Auth = getAuth();
const storage: Storage = getStorage();

export { admin, db, auth, storage };
