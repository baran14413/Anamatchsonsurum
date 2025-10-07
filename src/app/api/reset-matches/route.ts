
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

async function deleteAllDocsInCollection(collectionPath: string, batchSize: number) {
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
        const matchesSnapshot = await db.collection('matches').get();

        const batch = db.batch();
        let subcollectionDeletionPromises: Promise<any>[] = [];

        matchesSnapshot.forEach(matchDoc => {
            // Delete message subcollections
            const messagesPath = `matches/${matchDoc.id}/messages`;
            subcollectionDeletionPromises.push(deleteAllDocsInCollection(messagesPath, 100));
            // Delete the match document itself
            batch.delete(matchDoc.ref);
        });

        // Delete all denormalized matches from user subcollections
        const usersSnapshot = await db.collection('users').get();
        usersSnapshot.forEach(userDoc => {
            const userMatchesPath = `users/${userDoc.id}/matches`;
            subcollectionDeletionPromises.push(deleteAllDocsInCollection(userMatchesPath, 100));
        });

        // Execute all deletion promises and the main batch commit
        await Promise.all([
            ...subcollectionDeletionPromises,
            batch.commit()
        ]);
        
        return NextResponse.json({ message: 'Tüm eşleşmeler ve sohbetler başarıyla silindi.' });

    } catch (error: any) {
        console.error("Sistem Sıfırlama Hatası:", error);
        return NextResponse.json({ error: `Sistem sıfırlanamadı: ${error.message || String(error)}` }, { status: 500 });
    }
}
