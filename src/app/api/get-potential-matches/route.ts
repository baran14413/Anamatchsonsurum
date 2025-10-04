
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/admin';
import { UserProfile } from '@/lib/types';

export const dynamic = 'force-dynamic'; // Defaults to auto

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
        const interactedUserIds = interactionsSnapshot.docs.map(doc => doc.id);

        // 2. Get all users from the 'users' collection
        const allUsersSnapshot = await adminDb.collection('users').get();
        
        if (allUsersSnapshot.empty) {
            return NextResponse.json([]);
        }

        // 3. Filter out the current user and users they've already interacted with
        const potentialMatches = allUsersSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
            .filter(user => 
                user.id !== currentUserId && !interactedUserIds.includes(user.id)
            );
        
        if (potentialMatches.length === 0) {
            return NextResponse.json([]);
        }
        
        // 4. Shuffle and take a limited number of profiles (e.g., 10)
        const shuffled = potentialMatches.sort(() => 0.5 - Math.random());
        const selectedProfiles = shuffled.slice(0, 10);

        return NextResponse.json(selectedProfiles);

    } catch (error) {
        console.error('Error fetching potential matches:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
