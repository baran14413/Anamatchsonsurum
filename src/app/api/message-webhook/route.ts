
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { BOT_REPLIES, BOT_GREETINGS } from '@/lib/bot-data';
import type { ChatMessage, UserProfile } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

// It's better to get this from environment variables
const SHARED_SECRET = process.env.WEBHOOK_SECRET || 'your-very-secret-key';

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * Bu API rotası, bir kullanıcı bir bota mesaj gönderdiğinde VEYA bir botla eşleştiğinde tetiklenir.
 * Gelen isteğin türüne göre (ilk eşleşme mi, mevcut sohbet mi) işlem yapar.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Yetkilendirme Kontrolü
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    if (token !== SHARED_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Gelen Veriyi Ayrıştırma
    const { matchId, type, userId } = await req.json() as { matchId: string; type: 'MATCH' | 'MESSAGE'; userId: string; };

    if (!matchId || !type || !userId) {
      return NextResponse.json({ error: 'Gerekli alanlar eksik: matchId, type ve userId.' }, { status: 400 });
    }

    // Eşleşme ID'sinden bot'un ID'sini çıkar
    const botId = matchId.replace(userId, '').replace('_', '');

    // 3. Bot varlığını kontrol et
    const botDoc = await db.collection('users').doc(botId).get();
    if (!botDoc.exists || !botDoc.data()?.isBot) {
      // Alıcı bir bot değilse, işlem yapma.
      return NextResponse.json({ message: 'Alıcı bir bot değil.' });
    }
    
    // 4. Cevap metnini belirle
    let replyText: string;
    if (type === 'MATCH') {
      // Eğer yeni bir eşleşme ise, selamlaşma mesajlarından birini seç.
      replyText = getRandomItem(BOT_GREETINGS);
    } else {
      // Eğer mevcut bir sohbete mesaj ise, standart cevaplardan birini seç.
      replyText = getRandomItem(BOT_REPLIES);
    }
    
    // Küçük bir gecikme ekleyerek cevabın daha doğal görünmesini sağla
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

    // 5. Seçilen Cevabı Veritabanına Yazma
    const botReplyMessage: Partial<ChatMessage> = {
      matchId: matchId,
      senderId: botId,
      text: replyText,
      timestamp: FieldValue.serverTimestamp(),
      isRead: false,
      type: 'user',
    };
    await db.collection(`matches/${matchId}/messages`).add(botReplyMessage);
    
    // 6. Eşleşme listesindeki son mesajı ve okunmadı sayacını güncelle
    const batch = db.batch();
    const currentUserMatchRef = db.doc(`users/${userId}/matches/${matchId}`);
    // Sadece kullanıcıya giden mesajda unreadCount artırılır.
    batch.update(currentUserMatchRef, { lastMessage: replyText, timestamp: FieldValue.serverTimestamp(), unreadCount: FieldValue.increment(1) });
    
    const botUserMatchRef = db.doc(`users/${botId}/matches/${matchId}`);
    // Bot kendi gönderdiği mesajı okumuş sayılır, unreadCount artırılmaz.
    batch.update(botUserMatchRef, { lastMessage: replyText, timestamp: FieldValue.serverTimestamp() });
    
    await batch.commit();

    return NextResponse.json({ success: true, reply: replyText });

  } catch (error: any) {
    console.error("Bot mesaj webhook hatası:", error);
    return NextResponse.json({ error: `Bir sunucu hatası oluştu: ${error.message}` }, { status: 500 });
  }
}
