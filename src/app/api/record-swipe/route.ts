
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/admin';
import { FieldValue } from 'firebase-admin/firestore';

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

export async function POST(req: NextRequest) {
    const currentUserId = await getAuthenticatedUser(req);
    if (!currentUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { swipedUserId, direction } = await req.json();

        if (!swipedUserId || !direction || !['left', 'right'].includes(direction)) {
            return NextResponse.json({ error: 'Invalid swipe data' }, { status: 400 });
        }

        // 1. Record the interaction for the current user
        // This swipe is stored in a subcollection of the user who is doing the swiping.
        const interactionRef = adminDb
            .collection('users')
            .doc(currentUserId)
            .collection('interactions')
            .doc(swipedUserId);
        
        await interactionRef.set({
            swipe: direction,
            timestamp: FieldValue.serverTimestamp(),
        });

        // 2. If it was a 'right' swipe, check for a match
        if (direction === 'right') {
            // Check if the other user has also swiped right on the current user.
            const otherUserInteractionRef = adminDb
                .collection('users')
                .doc(swipedUserId)
                .collection('interactions')
                .doc(currentUserId);

            const otherUserInteractionDoc = await otherUserInteractionRef.get();

            if (otherUserInteractionDoc.exists && otherUserInteractionDoc.data()?.swipe === 'right') {
                // It's a MATCH!
                const matchId = [currentUserId, swipedUserId].sort().join('_');
                const matchDate = FieldValue.serverTimestamp();
                const matchData = {
                    id: matchId,
                    users: [currentUserId, swipedUserId],
                    matchDate: matchDate,
                };

                // Use a batch write to ensure atomicity
                const batch = adminDb.batch();

                // Create match document for the current user
                const currentUserMatchRef = adminDb
                    .collection('users')
                    .doc(currentUserId)
                    .collection('matches')
                    .doc(matchId);
                batch.set(currentUserMatchRef, matchData);
                

                // Create match document for the other user
                const otherUserMatchRef = adminDb
                    .collection('users')
                    doc(swipedUserId)
                    .collection('matches')
                    .doc(matchId);
                batch.set(otherUserMatchRef, matchData);

                await batch.commit();
                
                // Return that a match was made
                return NextResponse.json({ match: true });
            }
        }
        
        // No match, just a regular swipe
        return NextResponse.json({ match: false });

    } catch (error) {
        console.error('Error recording swipe:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
