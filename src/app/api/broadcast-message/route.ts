
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
         return NextResponse.json({ error: 'Sunucu bu eylem için yapılandırılmamış.' }, { status: 500 });
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
        const batches = [];
        let currentBatch = db.batch();
        let operationCount = 0;

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
            currentBatch.set(messageRef, systemMessage);
            operationCount++;

            if (operationCount === batchSize) {
                batches.push(currentBatch);
                currentBatch = db.batch();
                operationCount = 0;
            }
        }

        if (operationCount > 0) {
            batches.push(currentBatch);
        }
        
        await Promise.all(batches.map(batch => batch.commit()));

        return NextResponse.json({ message: 'Duyuru tüm kullanıcılara gönderildi.', recipientCount: usersSnapshot.size });

    } catch (error: any) {
        console.error("Broadcast message error:", error);
        return NextResponse.json({ error: `Duyuru gönderilirken bir hata oluştu: ${error.message}` }, { status: 500 });
    }
}
