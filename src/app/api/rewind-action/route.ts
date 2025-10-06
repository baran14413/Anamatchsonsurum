
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App, cert, credential } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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


export async function POST(req: NextRequest) {
    if (!adminApp || !db) {
         return NextResponse.json({ error: 'Server not configured for this action.' }, { status: 500 });
    }
    
    try {
        const { matchId } = await req.json();

        if (!matchId) {
            return NextResponse.json({ error: 'Match ID is required.' }, { status: 400 });
        }
        
        const matchDocRef = db.collection('matches').doc(matchId);
        const matchDoc = await matchDocRef.get();

        // We only delete the interaction if it's a simple like/dislike.
        // We don't want to undo a full match or a pending Super Like.
        if (matchDoc.exists()) {
             const matchData = matchDoc.data();
             if (matchData?.status === 'pending') {
                await matchDocRef.delete();
             } else {
                // If it's already matched or superliked, we don't delete it,
                // but we also don't throw an error. The client will just not be able to interact again.
                // This is a safe fallback.
             }
        }

        return NextResponse.json({ message: 'Rewind action processed successfully.' });

    } catch (error: any) {
        console.error("Rewind Action Error:", error);
        return NextResponse.json({ error: `Rewind action failed: ${error.message}` }, { status: 500 });
    }
}
