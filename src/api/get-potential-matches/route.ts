
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/admin';
import type { UserProfile } from '@/lib/types';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];
        
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const currentUserId = decodedToken.uid;

        // 1. Get IDs of users the current user has already swiped
        const interactionsSnapshot = await adminDb.collection(`users/${currentUserId}/interactions`).get();
        const interactedUserIds = new Set(interactionsSnapshot.docs.map(doc => doc.id));
        
        // Add current user to interacted set to filter them out
        interactedUserIds.add(currentUserId);
        
        // 2. Use a collectionGroup query to fetch ONLY the profile documents.
        const profilesSnapshot = await adminDb.collectionGroup('profile').get();
        
        const allUsers: UserProfile[] = [];
        profilesSnapshot.forEach(doc => {
            const userData = doc.data();
            // Ensure the profile document data exists and has a uid
            if (userData && userData.uid) {
                allUsers.push({
                    // CRITICAL FIX: The `id` for the profile in the app should be the user's UID,
                    // not the ID of the document itself (which is 'profile').
                    id: userData.uid, 
                    ...userData,
                    // Ensure images array always exists, even if it's empty.
                    images: userData.images || [], 
                } as UserProfile);
            }
        });
        
        // 3. Filter out users the current user has already interacted with
        const potentialMatches = allUsers.filter(user => !interactedUserIds.has(user.uid));

        // 4. Shuffle the potential matches for randomness
        const shuffledMatches = potentialMatches.sort(() => 0.5 - Math.random());

        return NextResponse.json(shuffledMatches);

    } catch (error: any) {
        console.error('API Error in get-potential-matches:', error);
        
        if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }
        
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
