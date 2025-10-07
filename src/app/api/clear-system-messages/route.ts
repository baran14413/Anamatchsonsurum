
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';

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
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'Kullanıcı ID\'si gerekli.' }, { status: 400 });
        }

        const systemMessagesPath = `users/${userId}/system_messages`;
        await deleteCollection(systemMessagesPath, 100);

        // Add the initial welcome message back
        await db.collection(systemMessagesPath).add({
            senderId: 'system',
            text: "BeMatch'e hoş geldin! Burası tüm duyuruları ve sistem mesajlarını görebileceğin kişisel kutun.",
            timestamp: new Date(),
            isRead: true,
        });
        
        return NextResponse.json({ message: 'Sistem mesajları geçmişi başarıyla temizlendi.' });

    } catch (error: any) {
        console.error("Sistem Mesajlarını Temizleme Hatası:", error);
        return NextResponse.json({ error: `Mesajlar temizlenemedi: ${error.code || error.message}` }, { status: 500 });
    }
}
