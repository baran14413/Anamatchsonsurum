
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { BOT_GREETINGS, BOT_REPLIES } from '@/lib/bot-data';
import type { ChatMessage, UserProfile } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

// It's better to get this from environment variables
const SHARED_SECRET = process.env.WEBHOOK_SECRET || 'your-very-secret-key';

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * This API route is triggered when a user sends a message to a bot OR when they match with a bot.
 * It processes the request based on the event type and sends a predefined random message.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authorization Check
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    if (token !== SHARED_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Incoming Data
    const { matchId, type, userId } = await req.json() as { matchId: string; type: 'MATCH' | 'MESSAGE'; userId: string; };

    if (!matchId || !type || !userId) {
      return NextResponse.json({ error: 'Required fields are missing: matchId, type, and userId.' }, { status: 400 });
    }

    // Extract bot ID from the match ID
    const botId = matchId.replace(userId, '').replace('_', '');

    // 3. Verify Bot Existence
    const botDoc = await db.collection('users').doc(botId).get();
    if (!botDoc.exists || !botDoc.data()?.isBot) {
      // If the recipient is not a bot, do nothing.
      return NextResponse.json({ message: 'Recipient is not a bot.' });
    }

    // 4. Determine Reply Text from predefined lists
    let replyText: string;

    if (type === 'MATCH') {
      // If it's a new match, select one of the greeting messages.
      replyText = getRandomItem(BOT_GREETINGS);
    } else {
      // If it's a message in an existing conversation, select a random generic reply.
      replyText = getRandomItem(BOT_REPLIES);
    }
    
    // Add a small delay to make the response feel more natural
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

    // 5. Write the Chosen Reply to the Database
    const botReplyMessage: Partial<ChatMessage> = {
      matchId: matchId,
      senderId: botId,
      text: replyText,
      timestamp: FieldValue.serverTimestamp(),
      isRead: false,
      type: 'user',
    };
    await db.collection(`matches/${matchId}/messages`).add(botReplyMessage);
    
    // 6. Update the last message and unread count in the match list
    const batch = db.batch();
    const currentUserMatchRef = db.doc(`users/${userId}/matches/${matchId}`);
    // Increment unreadCount for the user.
    batch.update(currentUserMatchRef, { lastMessage: replyText, timestamp: FieldValue.serverTimestamp(), unreadCount: FieldValue.increment(1) });
    
    const botUserMatchRef = db.doc(`users/${botId}/matches/${matchId}`);
    // The bot has "read" its own message, so we just update the text.
    batch.update(botUserMatchRef, { lastMessage: replyText, timestamp: FieldValue.serverTimestamp() });
    
    await batch.commit();

    return NextResponse.json({ success: true, reply: replyText });

  } catch (error: any) {
    console.error("Bot message webhook error:", error);
    // Return a more detailed error message during development/testing
    return NextResponse.json({ 
        error: `A server error occurred: ${error.message}`,
        stack: error.stack // Include stack trace for debugging
    }, { status: 500 });
  }
}
