
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

let adminApp: App | undefined;
let db: Firestore | undefined;

function getServiceAccount() {
    // 1. Check for Base64 encoded environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
        try {
            const decodedKey = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf-8');
            return JSON.parse(decodedKey);
        } catch(e) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY_BASE64. Ensure it's a valid Base64 encoded JSON.", e);
            // Fall through to try file-based method
        }
    }
    
    // 2. Check for file path environment variable (alternative)
    const keyPathFromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const searchPaths = [
        keyPathFromEnv, // Check env var path first
        path.resolve(process.cwd(), 'service-account-key.json'), // Default path in project root
    ].filter(p => typeof p === 'string') as string[];

    for (const keyPath of searchPaths) {
        try {
            if (fs.existsSync(keyPath)) {
                const keyFileContent = fs.readFileSync(keyPath, 'utf-8');
                return JSON.parse(keyFileContent);
            }
        } catch (e) {
            console.error(`Failed to read or parse service account key from ${keyPath}.`, e);
            // Continue to the next path
        }
    }
    
    // 3. If no key is found
    console.warn("Service account key not found. Firebase Admin SDK will not be initialized. Checked env vars and default file path.");
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
