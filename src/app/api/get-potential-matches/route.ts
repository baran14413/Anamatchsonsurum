
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
    if (!idToken) {
         return NextResponse.json({ error: 'Unauthorized: Token is missing' }, { status: 401 });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const currentUserId = decodedToken.uid;

    // Fetch IDs of users the current user has already interacted with
    const interactionsSnapshot = await adminDb
      .collection(`users/${currentUserId}/interactions`)
      .get();
    const interactedUserIds = interactionsSnapshot.docs.map(doc => doc.id);

    // Fetch all user profiles from the 'profile' subcollections
    const profilesSnapshot = await adminDb.collectionGroup('profile').get();
    
    const allUsers: UserProfile[] = [];
    profilesSnapshot.forEach(doc => {
      const userData = doc.data() as Omit<UserProfile, 'id'>;
      // IMPORTANT: Add the document ID as 'id' to the object
      allUsers.push({ id: doc.id, ...userData });
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
     if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
        return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
