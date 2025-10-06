
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

// Initialize Firebase Admin SDK
let adminApp: App;
if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            adminApp = initializeApp({
                credential: cert(serviceAccount)
            });
        } catch (e) {
            console.error("Firebase Admin initialization from service account key failed.", e);
        }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        adminApp = initializeApp({
            credential: credential.applicationDefault()
        });
    } else {
        console.error("Firebase Admin initialization failed. Ensure FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS is set.");
    }
} else {
    adminApp = getApps()[0];
}

const db = getFirestore(adminApp);

async function deleteCollection(collectionPath: string, batchSize: number) {
    const collectionRef = db.collection(collectionPath);
    let query = collectionRef.orderBy('__name__').limit(batchSize);

    while (true) {
        const snapshot = await query.get();
        if (snapshot.size === 0) {
            return;
        }

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        const lastVisible = snapshot.docs[snapshot.docs.length - 1];
        query = collectionRef.orderBy('__name__').startAfter(lastVisible).limit(batchSize);
    }
}


export async function POST(req: NextRequest) {
    if (!adminApp) {
        return NextResponse.json({ error: 'Server not configured for this action.' }, { status: 500 });
    }

    try {
        const matchesSnapshot = await db.collection('matches').get();
        const usersSnapshot = await db.collection('users').get();
        
        // --- 1. Delete all subcollections ---
        const deleteSubcollectionPromises: Promise<any>[] = [];

        // Delete all messages subcollections inside each match
        matchesSnapshot.forEach(matchDoc => {
            const messagesPath = `matches/${matchDoc.id}/messages`;
            deleteSubcollectionPromises.push(deleteCollection(messagesPath, 100));
        });

        // Delete all denormalized matches subcollections inside each user
        usersSnapshot.forEach(userDoc => {
            const userMatchesPath = `users/${userDoc.id}/matches`;
            deleteSubcollectionPromises.push(deleteCollection(userMatchesPath, 100));
        });

        await Promise.all(deleteSubcollectionPromises);
        
        // --- 2. Delete all documents in main 'matches' collection ---
        await deleteCollection('matches', 100);

        return NextResponse.json({ message: 'System reset successfully. All matches and chats have been deleted.' });

    } catch (error: any) {
        console.error("System Reset Error:", error);
        return NextResponse.json({ error: `System reset failed: ${error.message}` }, { status: 500 });
    }
}
