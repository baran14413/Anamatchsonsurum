
import { NextApiRequest, NextApiResponse } from 'next';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, serverTimestamp } from 'firebase-admin/firestore';
import { BOT_REPLIES } from '@/lib/bot-data';

// Initialize Firebase Admin SDK
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

if (!getApps().length) {
  initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : undefined,
  });
}

const db = getFirestore();

// Helper to get a random item from an array
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Authenticate the request
  const secret = process.env.NEXT_PUBLIC_WEBHOOK_SECRET;
  const authHeader = req.headers.authorization;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Process the request body
  const { matchId, type, userId } = req.body;

  if (!matchId || !type || !userId) {
    return res.status(400).json({ error: 'Missing required parameters: matchId, type, userId' });
  }

  // 3. Implement logic based on type
  if (type === 'MATCH') {
    try {
      const botId = matchId.replace(userId, '').replace('_', '');

      // Wait a random delay (10s to 60s) before sending the message
      const delay = Math.floor(Math.random() * (60000 - 10000 + 1)) + 10000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const greeting = getRandomItem(BOT_REPLIES);

      const messagesRef = db.collection(`matches/${matchId}/messages`);
      const user1MatchRef = db.collection('users').doc(userId).collection('matches').doc(matchId);
      const user2MatchRef = db.collection('users').doc(botId).collection('matches').doc(matchId);

      // Add the message to the chat
      await messagesRef.add({
        senderId: botId,
        text: greeting,
        timestamp: Timestamp.now(),
        isRead: false,
        type: 'user'
      });
      
      const updatePayload = {
          lastMessage: greeting,
          timestamp: serverTimestamp(),
          unreadCount: 1,
      };

      // Update the last message for the real user to see it in their match list
      await user1MatchRef.update(updatePayload);
      await user2MatchRef.update(updatePayload);


      return res.status(200).json({ success: true, message: 'Bot greeting sent.' });

    } catch (error: any) {
      console.error('Error in MATCH webhook:', error);
      return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }

  return res.status(400).json({ error: 'Invalid type specified' });
}

    
