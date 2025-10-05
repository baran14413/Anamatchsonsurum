
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, WriteBatch } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';

// Initialize Firebase Admin SDK
let adminApp: App;
if (!getApps().length) {
    // Check if running in a Google Cloud environment
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        adminApp = initializeApp({
            credential: credential.applicationDefault()
        });
    } else {
        // Fallback for local development if service account key is available as env var
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
            adminApp = initializeApp({
                credential: credential.cert(serviceAccount)
            });
        } catch (e) {
            console.error("Firebase Admin initialization failed. Ensure GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_KEY is set.", e);
            // We'll let it fail downstream if the app is still unusable
        }
    }
} else {
    adminApp = getApps()[0];
}

const db = getFirestore(adminApp);

// Initialize Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


async function deleteCollection(collectionPath: string, batchSize: number, batch: WriteBatch) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, batch, resolve).catch(reject);
    });
}

async function deleteQueryBatch(query: FirebaseFirestore.Query, batch: WriteBatch, resolve: (value: unknown) => void) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        resolve(true);
        return;
    }

    const publicIdsToDelete: string[] = [];

    // Delete documents in a batch
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.imagePublicId) {
            publicIdsToDelete.push(data.imagePublicId);
        }
        batch.delete(doc.ref);
    });
    
    // Delete images from Cloudinary if any
    if (publicIdsToDelete.length > 0) {
        await cloudinary.api.delete_resources(publicIdsToDelete);
    }

    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
        deleteQueryBatch(query, batch, resolve);
    });
}


export async function POST(req: NextRequest) {
    try {
        const { matchId } = await req.json();

        if (!matchId) {
            return NextResponse.json({ error: 'Match ID is required.' }, { status: 400 });
        }

        const [user1Id, user2Id] = matchId.split('_');

        const batch = db.batch();
        
        // 1. Delete all messages and their images from Cloudinary
        const messagesPath = `matches/${matchId}/messages`;
        await deleteCollection(messagesPath, 100, batch);

        // 2. Delete denormalized match data from both users' subcollections
        const user1MatchRef = db.collection('users').doc(user1Id).collection('matches').doc(matchId);
        const user2MatchRef = db.collection('users').doc(user2Id).collection('matches').doc(matchId);
        batch.delete(user1MatchRef);
        batch.delete(user2MatchRef);

        // 3. Delete the main match document
        const matchDocRef = db.collection('matches').doc(matchId);
        batch.delete(matchDocRef);

        // Commit all batched writes
        await batch.commit();

        return NextResponse.json({ message: 'Chat deleted successfully.' });

    } catch (error: any) {
        console.error("Chat Deletion Error:", error);
        return NextResponse.json({ error: `Chat deletion failed: ${error.message}` }, { status: 500 });
    }
}
