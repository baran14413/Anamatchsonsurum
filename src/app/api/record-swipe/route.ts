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

        if (!swipedUserId || !direction || (direction !== 'left' && direction !== 'right')) {
            return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
        }

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const currentUserId = decodedToken.uid;
        
        // The document ID is a composite key of the two user IDs, sorted alphabetically.
        const matchId = [currentUserId, swipedUserId].sort().join('_');
        const matchRef = adminDb.doc(`matches/${matchId}`);
        
        const batch = adminDb.batch();
        let isMatch = false;

        const doc = await matchRef.get();

        if (direction === 'right') {
            if (doc.exists) {
                const docData = doc.data();
                // Check if the other user liked us
                if (docData?.status === 'liked' && docData.user1Id === swipedUserId) {
                    isMatch = true;
                    // It's a match! Update status and add to both users' match subcollections.
                    batch.update(matchRef, { status: 'matched', matchDate: FieldValue.serverTimestamp() });

                    const matchDataForSubcollection = {
                        id: matchId,
                        users: [currentUserId, swipedUserId],
                        matchDate: FieldValue.serverTimestamp(),
                    };

                    const currentUserMatchRef = adminDb.doc(`users/${currentUserId}/matches/${matchId}`);
                    const otherUserMatchRef = adminDb.doc(`users/${swipedUserId}/matches/${matchId}`);
                    
                    batch.set(currentUserMatchRef, matchDataForSubcollection);
                    batch.set(otherUserMatchRef, matchDataForSubcollection);
                } else {
                    // Document exists, but it's not a pending like from the other user.
                    // This could be our own previous 'disliked' or their 'disliked'.
                    // We'll just overwrite/set our 'liked' status.
                     batch.set(matchRef, {
                        id: matchId,
                        user1Id: currentUserId,
                        user2Id: swipedUserId,
                        status: 'liked',
                        timestamp: FieldValue.serverTimestamp(),
                    });
                }
            } else {
                // No previous interaction, create a new 'liked' record
                batch.set(matchRef, {
                    id: matchId,
                    user1Id: currentUserId,
                    user2Id: swipedUserId,
                    status: 'liked',
                    timestamp: FieldValue.serverTimestamp(),
                });
            }
        } else { // direction === 'left'
            // For a dislike, we just record it.
             batch.set(matchRef, {
                id: matchId,
                user1Id: currentUserId,
                user2Id: swipedUserId,
                status: 'disliked',
                timestamp: FieldValue.serverTimestamp(),
            }, { merge: true }); // Merge to not overwrite a potential 'liked' from the other user
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
