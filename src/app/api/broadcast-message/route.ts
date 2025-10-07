
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();

        if (!message || typeof message !== 'string' || message.trim() === '') {
            return NextResponse.json({ error: 'Mesaj boş olamaz.' }, { status: 400 });
        }

        const usersSnapshot = await db.collection('users').get();
        if (usersSnapshot.empty) {
            return NextResponse.json({ count: 0, message: 'Mesaj gönderilecek kullanıcı bulunamadı.' });
        }

        const batch = db.batch();
        let userCount = 0;

        usersSnapshot.forEach(userDoc => {
            const userId = userDoc.id;
            const systemMessagesColRef = db.collection(`users/${userId}/system_messages`).doc();
            
            batch.set(systemMessagesColRef, {
                senderId: 'system',
                text: message,
                timestamp: new Date(),
                isRead: false,
            });
            userCount++;
        });

        await batch.commit();

        return NextResponse.json({ message: 'Duyuru başarıyla tüm kullanıcılara gönderildi.', count: userCount });

    } catch (error: any) {
        console.error("Duyuru Gönderme Hatası:", error);
        return NextResponse.json({ error: `Duyuru gönderilemedi: ${error.message || String(error)}` }, { status: 500 });
    }
}
