
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { generateBotReply, BotReplyInput } from '@/ai/flows/bot-chat-flow';
import type { ChatMessage, UserProfile } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

// Güvenlik için, webhook çağrısının yetkili bir kaynaktan geldiğini doğrulamak amacıyla kullanılır.
// Basit bir güvenlik önlemi olarak ayarlanmıştır.
const SHARED_SECRET = process.env.WEBHOOK_SECRET || 'your-very-secret-key';


// calculateAge fonksiyonu admin-sdk `firebase-admin` kullanılan bir dosyada
// 'use client' olmadan kullanılabileceği için burada tanımlanmıştır.
const calculateAge = (dateString?: string): number | null => {
    if (!dateString) return null;
    const birthDate = new Date(dateString);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};


/**
 * Bu API rotası, Firestore'a yeni bir mesaj eklendiğinde (bir Cloud Function tarafından) tetiklenir.
 * Gelen mesaj bir bot'a gönderilmişse, yapay zeka akışını kullanarak bir cevap üretir ve sohbeti devam ettirir.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Yetkilendirme Kontrolü
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    if (token !== SHARED_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Gelen Veriyi Ayrıştırma
    const { matchId, message } = await req.json() as { matchId: string; message: ChatMessage };

    if (!matchId || !message || !message.senderId) {
      return NextResponse.json({ error: 'Gerekli alanlar eksik: matchId ve message.' }, { status: 400 });
    }

    // Eşleşme ID'sinden bot'un ve kullanıcının ID'lerini çıkar
    const [user1Id, user2Id] = matchId.split('_');
    const botId = message.senderId === user1Id ? user2Id : user1Id;
    const userId = message.senderId;

    // 3. Bot ve Kullanıcı Profillerini Veritabanından Alma
    const botDoc = await db.collection('users').doc(botId).get();
    const userDoc = await db.collection('users').doc(userId).get();
    
    // Eğer bot değilse veya profiller bulunamazsa işlemi sonlandır
    if (!botDoc.exists || !botDoc.data()?.isBot || !userDoc.exists) {
      return NextResponse.json({ message: 'Alıcı bir bot değil veya profiller bulunamadı.' });
    }
    
    const botProfile = botDoc.data() as UserProfile;
    const userProfile = userDoc.data() as UserProfile;

    // 4. Sohbet Geçmişini Alma
    const messagesSnap = await db.collection(`matches/${matchId}/messages`).orderBy('timestamp', 'asc').limit(20).get();
    const conversationHistory = messagesSnap.docs.map(doc => {
        const msg = doc.data();
        return {
            isUser: msg.senderId === userId,
            message: msg.text || '',
        };
    });

    // 5. Yapay Zeka Akışını Çağırma
    const aiInput: BotReplyInput = {
      botProfile: {
          fullName: botProfile.fullName || 'BeMatch Kullanıcısı',
          age: calculateAge(botProfile.dateOfBirth) || 25,
          bio: botProfile.bio || '',
          interests: botProfile.interests || [],
      },
      userName: userProfile.fullName || 'Kullanıcı',
      conversationHistory: conversationHistory,
    };
    
    const { reply } = await generateBotReply(aiInput);

    // 6. Üretilen Cevabı Veritabanına Yazma
    const botReplyMessage: Partial<ChatMessage> = {
      matchId: matchId,
      senderId: botId,
      text: reply,
      timestamp: FieldValue.serverTimestamp(),
      isRead: false,
      type: 'user',
    };
    await db.collection(`matches/${matchId}/messages`).add(botReplyMessage);
    
    // 7. Eşleşme listesindeki son mesajı güncelle
    const batch = db.batch();
    const currentUserMatchRef = db.doc(`users/${userId}/matches/${matchId}`);
    batch.update(currentUserMatchRef, { lastMessage: reply, timestamp: FieldValue.serverTimestamp(), unreadCount: FieldValue.increment(1) });
    const botUserMatchRef = db.doc(`users/${botId}/matches/${matchId}`);
    batch.update(botUserMatchRef, { lastMessage: reply, timestamp: FieldValue.serverTimestamp() });
    await batch.commit();


    return NextResponse.json({ success: true, reply });

  } catch (error: any) {
    console.error("Bot mesaj webhook hatası:", error);
    return NextResponse.json({ error: `Bir sunucu hatası oluştu: ${error.message}` }, { status: 500 });
  }
}
