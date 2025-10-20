'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { BOT_GREETINGS } from '@/lib/bot-data';
import { generateBotReply, BotReplyInput, BotReplyInputSchema } from '@/ai/flows/bot-chat-flow';
import type { ChatMessage, UserProfile } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

// It's better to get this from environment variables
const SHARED_SECRET = process.env.WEBHOOK_SECRET || 'your-very-secret-key';

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * This API route is triggered when a user sends a message to a bot OR when they match with a bot.
 * It processes the request based on the event type (initial match vs. existing conversation).
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
    const botProfile = botDoc.data() as UserProfile;
    if (!botDoc.exists || !botProfile?.isBot) {
      // If the recipient is not a bot, do nothing.
      return NextResponse.json({ message: 'Recipient is not a bot.' });
    }

    const userDoc = await db.collection('users').doc(userId).get();
    const userProfile = userDoc.data() as UserProfile;
    if(!userDoc.exists) {
        return NextResponse.json({ message: 'User not found.' });
    }

    // 4. Determine Reply Text
    let replyText: string;

    if (type === 'MATCH') {
      // If it's a new match, select one of the greeting messages.
      replyText = getRandomItem(BOT_GREETINGS);
    } else {
      // If it's a message in an existing conversation, use the AI flow.
      const messagesSnap = await db.collection(`matches/${matchId}/messages`).orderBy('timestamp', 'desc').limit(20).get();
      const conversationHistory = messagesSnap.docs.map(doc => {
        const msg = doc.data();
        return {
          isUser: msg.senderId === userId,
          message: msg.text || '',
        };
      }).reverse();
        
      const aiInput: BotReplyInput = {
        botProfile: {
            fullName: botProfile.fullName || 'Bot',
            age: botProfile.dateOfBirth ? new Date().getFullYear() - new Date(botProfile.dateOfBirth).getFullYear() : 25,
            bio: botProfile.bio || '',
            interests: botProfile.interests || []
        },
        userName: userProfile.fullName || 'User',
        conversationHistory,
      };

      // Validate input with Zod before passing to the AI flow
      BotReplyInputSchema.parse(aiInput);

      const aiResult = await generateBotReply(aiInput);
      replyText = aiResult.reply;
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
    // Only increment unreadCount for the user's message.
    batch.update(currentUserMatchRef, { lastMessage: replyText, timestamp: FieldValue.serverTimestamp(), unreadCount: FieldValue.increment(1) });
    
    const botUserMatchRef = db.doc(`users/${botId}/matches/${matchId}`);
    // The bot is considered to have read its own message, so unreadCount is not incremented.
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
