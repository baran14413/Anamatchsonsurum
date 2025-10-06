
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, WriteBatch, Query } from 'firebase-admin/firestore';
import { v2 as cloudinary } from 'cloudinary';

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin(): App | null {
    if (getApps().length) {
        return getApps()[0];
    }
    
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            return initializeApp({
                credential: cert(serviceAccount)
            });
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            // Fallback for Google Cloud environment
            return initializeApp();
        } else {
            console.error("Firebase Admin initialization failed. Ensure FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS is set.");
            return null;
        }
    } catch(e) {
        console.error("Firebase Admin initialization failed.", e);
        return null;
    }
}

const adminApp = initializeFirebaseAdmin();
const db = adminApp ? getFirestore(adminApp) : null;


// Initialize Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function deleteCollection(collectionPath: string, batchSize: number) {
    if (!db) throw new Error("Firestore not initialized");

    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.limit(batchSize);

    let snapshot = await query.get();
    while (snapshot.size > 0) {
        const batch = db.batch();
        const publicIdsToDelete: string[] = [];

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.imagePublicId) {
                publicIdsToDelete.push(data.imagePublicId);
            }
            batch.delete(doc.ref);
        });

        if (publicIdsToDelete.length > 0) {
            try {
                await cloudinary.api.delete_resources(publicIdsToDelete);
            } catch(cloudinaryError) {
                console.error("Cloudinary deletion failed for some resources, but continuing Firestore deletion:", cloudinaryError);
            }
        }

        await batch.commit();

        snapshot = await query.get();
    }
}


export async function POST(req: NextRequest) {
    try {
        const { matchId } = await req.json();

        if (!matchId) {
            return NextResponse.json({ error: 'Match ID is required.' }, { status: 400 });
        }
        if (!adminApp || !db) {
             return NextResponse.json({ error: 'Server not configured for this action.' }, { status: 500 });
        }

        const [user1Id, user2Id] = matchId.split('_');
        
        // 1. Delete all messages and their images from Cloudinary
        const messagesPath = `matches/${matchId}/messages`;
        await deleteCollection(messagesPath, 100);

        // 2. Use a single batch for the final deletions
        const batch = db.batch();

        // Delete denormalized match data from both users' subcollections
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
