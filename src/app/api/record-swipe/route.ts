import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];

        const { swipedUserId, direction } = await req.json();

        if (!swipedUserId || !direction) {
            return NextResponse.json({ error: 'Missing swipedUserId or direction' }, { status: 400 });
        }

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const currentUserId = decodedToken.uid;

        const batch = adminDb.batch();

        // Record the swipe in the current user's interactions subcollection
        const currentUserInteractionRef = adminDb.doc(`users/${currentUserId}/interactions/${swipedUserId}`);
        batch.set(currentUserInteractionRef, {
            swipe: direction,
            timestamp: FieldValue.serverTimestamp(),
        });

        let isMatch = false;

        if (direction === 'right') {
            // Check if the other user has swiped right on the current user
            const otherUserInteractionRef = adminDb.doc(`users/${swipedUserId}/interactions/${currentUserId}`);
            const otherUserSwipeDoc = await otherUserInteractionRef.get();

            if (otherUserSwipeDoc.exists && otherUserSwipeDoc.data()?.swipe === 'right') {
                isMatch = true;
                const matchId = [currentUserId, swipedUserId].sort().join('_');
                const matchDate = FieldValue.serverTimestamp();
                const [user1Id, user2Id] = [currentUserId, swipedUserId].sort();
                
                const matchData = {
                    id: matchId,
                    user1Id,
                    user2Id,
                    matchDate: matchDate,
                    // You might want to include denormalized user info here
                    users: [currentUserId, swipedUserId],
                };
                
                // Create the match document for the current user
                const currentUserMatchRef = adminDb.doc(`users/${currentUserId}/matches/${matchId}`);
                batch.set(currentUserMatchRef, matchData);
                
                // Create the match document for the other user
                const otherUserMatchRef = adminDb.doc(`users/${swipedUserId}/matches/${matchId}`);
                batch.set(otherUserMatchRef, matchData);
            }
        }
        
        await batch.commit();

        return NextResponse.json({ success: true, match: isMatch });

    } catch (error: any) {
        console.error('API Error in record-swipe:', error);
        
        if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
