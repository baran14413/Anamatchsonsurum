
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/admin';
import type { UserProfile } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getAuthenticatedUser(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        return decodedToken.uid;
    } catch (error) {
        console.error('Error verifying auth token:', error);
        return null;
    }
}

export async function GET(req: NextRequest) {
    const currentUserId = await getAuthenticatedUser(req);
    if (!currentUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Get IDs of users the current user has already interacted with
        const interactionsSnapshot = await adminDb
            .collection('users')
            .doc(currentUserId)
            .collection('interactions')
            .get();
        
        const interactedUserIds = new Set(interactionsSnapshot.docs.map(doc => doc.id));
        
        // Also add the current user's ID to the set to filter them out
        interactedUserIds.add(currentUserId);

        // 2. Get all users from Firestore
        const usersSnapshot = await adminDb.collection('users').get();
        if (usersSnapshot.empty) {
            return NextResponse.json([]);
        }

        const allUsers = usersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as UserProfile));
        
        // 3. Filter out users the current user has already interacted with
        let potentialMatches = allUsers.filter(user => !interactedUserIds.has(user.id));
        
        // 4. Shuffle the results for randomness in the swipe stack
        potentialMatches.sort(() => Math.random() - 0.5);

        return NextResponse.json(potentialMatches);

    } catch (error) {
        console.error("Error fetching potential matches:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
