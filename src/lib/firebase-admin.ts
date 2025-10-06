
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

let adminApp: App | undefined;
let db: Firestore | undefined;

function getServiceAccount() {
    // 1. Check for Base64 encoded environment variable (preferred method for deployment)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
        try {
            const decodedKey = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf-8');
            return JSON.parse(decodedKey);
        } catch(e) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY_BASE64. Ensure it's a valid Base64 encoded JSON.", e);
        }
    }
    
    // 2. Check for file path environment variable (common for local/CI)
    const keyPathFromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (keyPathFromEnv) {
        try {
            const resolvedPath = path.resolve(process.cwd(), keyPathFromEnv);
            if (fs.existsSync(resolvedPath)) {
                const keyFileContent = fs.readFileSync(resolvedPath, 'utf-8');
                return JSON.parse(keyFileContent);
            }
        } catch (e) {
            console.error(`Failed to read or parse service account key from GOOGLE_APPLICATION_CREDENTIALS path: ${keyPathFromEnv}.`, e);
        }
    }

    // 3. Check for a default file path in the project root (for local development)
    const defaultKeyPath = path.resolve(process.cwd(), 'service-account-key.json');
     try {
        if (fs.existsSync(defaultKeyPath)) {
            const keyFileContent = fs.readFileSync(defaultKeyPath, 'utf-8');
            return JSON.parse(keyFileContent);
        }
    } catch (e) {
        console.error(`Failed to read or parse service account key from default path: ${defaultKeyPath}.`, e);
    }
    
    // 4. If no key is found at all
    console.warn(
      `
      [Firebase Admin] Service account key not found. Firebase Admin SDK will not be initialized.
      This is expected if you are only using client-side features.
      For server-side features (API routes), you need to provide credentials.
      Checked for:
      1. FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 environment variable.
      2. GOOGLE_APPLICATION_CREDENTIALS environment variable.
      3. 'service-account-key.json' file in the project root.
      `
    );
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
    }
} else {
    adminApp = getApps()[0];
    if (adminApp) {
        db = getFirestore(adminApp);
    }
}

export { adminApp, db };
