
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// This function now takes a CollectionReference directly.
async function deleteCollection(collectionRef: FirebaseFirestore.CollectionReference, batchSize: number) {
    if (!db) {
        throw new Error("Veritabanı başlatılamadı.");
    }
    
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
    if (!db) {
        return NextResponse.json({ error: 'Sunucu hatası: Veritabanı başlatılamadı.' }, { status: 500 });
    }

    try {
        const matchesSnapshot = await db.collection('matches').get();
        const usersSnapshot = await db.collection('users').get();
        
        // --- 1. Delete all subcollections ---
        const deleteSubcollectionPromises: Promise<any>[] = [];

        // Delete all messages subcollections inside each match
        matchesSnapshot.forEach(matchDoc => {
            const messagesRef = matchDoc.ref.collection('messages');
            deleteSubcollectionPromises.push(deleteCollection(messagesRef, 100));
        });

        // Delete all denormalized matches subcollections inside each user
        usersSnapshot.forEach(userDoc => {
            const userMatchesRef = userDoc.ref.collection('matches');
            deleteSubcollectionPromises.push(deleteCollection(userMatchesRef, 100));
        });

        await Promise.all(deleteSubcollectionPromises);
        
        // --- 2. Delete all documents in main 'matches' collection ---
        await deleteCollection(db.collection('matches'), 100);

        return NextResponse.json({ message: 'Sistem başarıyla sıfırlandı. Tüm eşleşmeler ve sohbetler silindi.' });

    } catch (error: any) {
        console.error("Sistem Sıfırlama Hatası:", error);
        return NextResponse.json({ error: `Sistem sıfırlanamadı: ${error.message}` }, { status: 500 });
    }
}
