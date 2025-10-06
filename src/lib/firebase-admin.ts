
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

let adminApp: App;
let db: Firestore;

// Heroku, Vercel, vb. platformlar için JSON içeriğini Base64'ten çözme
function getServiceAccount() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
        try {
            const decodedKey = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf-8');
            return JSON.parse(decodedKey);
        } catch(e) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY_BASE64:", e);
        }
    }
    
    // Yerel geliştirme ve dosya tabanlı ortamlar için
    try {
        const keyPath = path.resolve(process.cwd(), 'service-account-key.json');
        if (fs.existsSync(keyPath)) {
            const serviceAccount = require('../../service-account-key.json');
            return serviceAccount;
        }
    } catch(e) {
         console.error("Failed to load service-account-key.json from file system:", e);
    }
    
    return null;
}

const serviceAccount = getServiceAccount();


if (!getApps().length) {
    if (serviceAccount) {
         try {
            adminApp = initializeApp({
                credential: cert(serviceAccount),
            });
            db = getFirestore(adminApp);
        } catch (e) {
            console.error('Firebase Admin SDK initialization failed:', e);
        }
    } else {
        console.error("Firebase Admin SDK could not be initialized. Service account key is missing or invalid.");
    }
} else {
    adminApp = getApps()[0]!;
    db = getFirestore(adminApp);
}

export { adminApp, db };
