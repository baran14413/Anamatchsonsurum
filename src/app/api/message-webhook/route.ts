
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { BOT_REPLIES } from '@/lib/bot-data';
import type { ChatMessage } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

// Güvenlik için, webhook çağrısının yetkili bir kaynaktan geldiğini doğrulamak amacıyla kullanılır.
const SHARED_SECRET = process.env.NEXT_PUBLIC_WEBHOOK_SECRET || 'your-very-secret-key';

// Basit, önceden tanımlanmış bir cevap havuzundan rastgele bir cevap seçer.
const getRandomBotReply = () => {
    return BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)];
};

/**
 * Bu API rotası, bir kullanıcı bir bota mesaj gönderdiğinde doğrudan istemciden tetiklenir.
 * Gelen mesaj bir bot'a gönderilmişse, yapay zeka yerine önceden tanımlanmış cevap havuzundan
 * rastgele bir cevap seçer ve sohbeti devam ettirir.
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

    // 3. Bot varlığını kontrol et
    const botDoc = await db.collection('users').doc(botId).get();
    if (!botDoc.exists || !botDoc.data()?.isBot) {
      // Alıcı bir bot değilse, işlem yapma.
      return NextResponse.json({ message: 'Alıcı bir bot değil.' });
    }
    
    // 4. Rastgele bir cevap seç
    const reply = getRandomBotReply();
    
    // Küçük bir gecikme ekleyerek cevabın daha doğal görünmesini sağla
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

    // 5. Seçilen Cevabı Veritabanına Yazma
    const botReplyMessage: Partial<ChatMessage> = {
      matchId: matchId,
      senderId: botId,
      text: reply,
      timestamp: FieldValue.serverTimestamp(),
      isRead: false,
      type: 'user',
    };
    await db.collection(`matches/${matchId}/messages`).add(botReplyMessage);
    
    // 6. Eşleşme listesindeki son mesajı güncelle
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
