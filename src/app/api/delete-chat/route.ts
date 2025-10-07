
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';

// Helper to delete a subcollection
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

        if (snapshot.size < batchSize) {
            break;
        }

        const lastVisible = snapshot.docs[snapshot.docs.length - 1];
        query = collectionRef.orderBy('__name__').startAfter(lastVisible).limit(batchSize);
    }
}

export async function POST(req: NextRequest) {
    try {
        const { matchId } = await req.json();

        if (!matchId) {
            return NextResponse.json({ error: 'Eşleşme ID\'si gerekli.' }, { status: 400 });
        }

        const matchDocRef = db.collection('matches').doc(matchId);
        const matchDoc = await matchDocRef.get();

        if (!matchDoc.exists) {
            // If the main match doc is already gone, that's okay, we can still try to clean up.
            // But we can't get user IDs from it. Let's assume the client knows best and proceed if possible,
            // or just return success if we can't do anything else.
             return NextResponse.json({ message: 'Eşleşme zaten silinmiş veya bulunamadı.' });
        }
        
        const { user1Id, user2Id } = matchDoc.data()!;

        // 1. Delete messages subcollection
        await deleteCollection(`matches/${matchId}/messages`, 100);

        // 2. Delete denormalized match data from both users (if they exist)
        const batch = db.batch();
        if(user1Id) {
            const user1MatchRef = db.doc(`users/${user1Id}/matches/${matchId}`);
            batch.delete(user1MatchRef);
        }
        if(user2Id) {
            const user2MatchRef = db.doc(`users/${user2Id}/matches/${matchId}`);
            batch.delete(user2MatchRef);
        }

        // 3. Delete the main match document
        batch.delete(matchDocRef);
        
        await batch.commit();
        
        return NextResponse.json({ message: 'Sohbet ve eşleşme başarıyla silindi.' });

    } catch (error: any) {
        console.error("Sohbet Silme Hatası:", error);
        // Ensure a valid JSON response even on failure
        return NextResponse.json({ error: `Sunucu hatası: Sohbet silinemedi. ${error.message}` }, { status: 500 });
    }
}

    