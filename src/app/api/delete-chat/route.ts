
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

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
            return NextResponse.json({ error: 'Eşleşme bulunamadı.' }, { status: 404 });
        }
        
        const { user1Id, user2Id } = matchDoc.data()!;

        // 1. Delete messages subcollection
        await deleteCollection(`matches/${matchId}/messages`, 100);

        // 2. Delete denormalized match data from both users
        const batch = db.batch();
        const user1MatchRef = db.doc(`users/${user1Id}/matches/${matchId}`);
        const user2MatchRef = db.doc(`users/${user2Id}/matches/${matchId}`);
        
        batch.delete(user1MatchRef);
        batch.delete(user2MatchRef);

        // 3. Delete the main match document
        batch.delete(matchDocRef);
        
        await batch.commit();
        
        return NextResponse.json({ message: 'Sohbet ve eşleşme başarıyla silindi.' });

    } catch (error: any) {
        console.error("Sohbet Silme Hatası:", error);
        return NextResponse.json({ error: `Sohbet silinemedi: ${error.message || String(error)}` }, { status: 500 });
    }
}
