import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let db: Firestore;

if (!getApps().length) {
  adminApp = initializeApp();
} else {
  adminApp = getApps()[0]!;
}

db = getFirestore(adminApp);

export { adminApp, db };
