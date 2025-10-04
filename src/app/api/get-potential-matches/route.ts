import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/admin';
import type { UserProfile } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }
    
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const currentUserId = decodedToken.uid;

    // Fetch IDs of users the current user has already interacted with
    const interactionsSnapshot = await adminDb
      .collection(`users/${currentUserId}/interactions`)
      .get();
    const interactedUserIds = interactionsSnapshot.docs.map(doc => doc.id);

    // Fetch all users from the 'users' collection
    const usersSnapshot = await adminDb.collection('users').get();
    
    const allUsers: UserProfile[] = [];
    usersSnapshot.forEach(doc => {
      // Ensure the document data matches the UserProfile type, at least partially.
      const userData = doc.data() as Partial<UserProfile>;
      if(userData.uid) {
        allUsers.push({ id: doc.id, ...userData } as UserProfile);
      }
    });

    // Filter out the current user and users they've already interacted with
    const potentialMatches = allUsers.filter(user => 
      user.id !== currentUserId && !interactedUserIds.includes(user.id)
    );

    // Shuffle the potential matches
    const shuffledMatches = potentialMatches.sort(() => 0.5 - Math.random());

    return NextResponse.json(shuffledMatches);

  } catch (error: any) {
    console.error('Error in get-potential-matches:', error);
     if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
        return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
