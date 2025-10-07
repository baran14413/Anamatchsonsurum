
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary only if the credentials are provided
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}


async function deleteCollection(collectionPath: string, batchSize: number) {
    const collectionRef = db.collection(collectionPath);
    let query = collectionRef.orderBy('__name__').limit(batchSize);

    while (true) {
        const snapshot = await query.get();
        if (snapshot.size === 0) {
            return;
        }

        const batch = db.batch();
        const publicIdsToDelete: string[] = [];

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            // Ensure public_id exists and is not a google-related one
            if (data.imagePublicId && !data.imagePublicId.startsWith('google_')) {
                publicIdsToDelete.push(data.imagePublicId);
            }
            batch.delete(doc.ref);
        });
        
        await batch.commit();

        // Only try to delete from cloudinary if it's configured and there are images to delete.
        if (publicIdsToDelete.length > 0 && cloudinary.config().api_key) {
            try {
                // This will delete up to 100 resources at a time.
                await cloudinary.api.delete_resources(publicIdsToDelete, { resource_type: 'image' });
                await cloudinary.api.delete_resources(publicIdsToDelete, { resource_type: 'video' });
            } catch(cloudinaryError) {
                console.error("Cloudinary silme işlemi bazı kaynaklar için başarısız oldu, ancak Firestore silme işlemine devam ediliyor:", cloudinaryError);
            }
        }

        if (snapshot.size < batchSize) {
            break;
        }

        const lastVisible = snapshot.docs[snapshot.docs.length - 1];
        query = collectionRef.orderBy('__name__').startAfter(lastVisible).limit(batchSize);
    }
}


export async function POST(req: NextRequest) {
    try {
        const { matchId } = await req.json();

        if (!matchId) {
            return NextResponse.json({ error: 'Eşleşme ID\'si gerekli.' }, { status: 400 });
        }
        
        const [user1Id, user2Id] = matchId.split('_');
        
        // 1. Delete all messages and their images from Cloudinary
        const messagesPath = `matches/${matchId}/messages`;
        await deleteCollection(messagesPath, 100);

        // 2. Use a single batch for the final deletions
        const batch = db.batch();

        // Delete denormalized match data from both users' subcollections
        const user1MatchRef = db.collection('users').doc(user1Id).collection('matches').doc(matchId);
        const user2MatchRef = db.collection('users').doc(user2Id).collection('matches').doc(matchId);
        batch.delete(user1MatchRef);
        batch.delete(user2MatchRef);

        // 3. Delete the main match document
        const matchDocRef = db.collection('matches').doc(matchId);
        batch.delete(matchDocRef);

        // Commit all batched writes
        await batch.commit();

        return NextResponse.json({ message: 'Sohbet başarıyla silindi.' });

    } catch (error: any) {
        console.error("Sohbet Silme Hatası:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: `Sohbet silinemedi: ${errorMessage}` }, { status: 500 });
    }
}
