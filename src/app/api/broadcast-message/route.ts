
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    if (!db) {
         return NextResponse.json({ error: 'Sunucu hatası: Veritabanı başlatılamadı.' }, { status: 500 });
    }

    try {
        const { message } = await req.json();

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return NextResponse.json({ error: 'Mesaj metni gerekli ve boş olamaz.' }, { status: 400 });
        }

        const usersSnapshot = await db.collection('users').get();
        if (usersSnapshot.empty) {
             return NextResponse.json({ message: 'Gönderilecek kullanıcı bulunamadı.', recipientCount: 0 });
        }
        
        const batchSize = 500;
        let batch = db.batch();
        let operationCount = 0;
        const commitPromises: Promise<any>[] = [];

        const systemMessage = {
            senderId: 'system',
            text: message,
            timestamp: new Date(),
            isRead: false,
        };

        for (let i = 0; i < usersSnapshot.docs.length; i++) {
            const userDoc = usersSnapshot.docs[i];
            const userId = userDoc.id;
            const messageRef = db.collection('users').doc(userId).collection('system_messages').doc();
            batch.set(messageRef, systemMessage);
            operationCount++;

            if (operationCount === batchSize) {
                commitPromises.push(batch.commit());
                batch = db.batch();
                operationCount = 0;
            }
        }

        if (operationCount > 0) {
            commitPromises.push(batch.commit());
        }
        
        await Promise.all(commitPromises);

        return NextResponse.json({ message: 'Duyuru tüm kullanıcılara gönderildi.', recipientCount: usersSnapshot.size });

    } catch (error: any) {
        console.error("Duyuru gönderme hatası:", error);
        return NextResponse.json({ error: `Duyuru gönderilirken bir hata oluştu: ${error.code || error.message}` }, { status: 500 });
    }
}
