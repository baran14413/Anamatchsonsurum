
import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/firebase/admin';

export const runtime = 'nodejs';

async function deleteFromFirebaseStorage(public_id: string): Promise<void> {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
    const bucket = storage.bucket(bucketName);
    const fileRef = bucket.file(public_id);

    try {
        await fileRef.delete();
    } catch (error: any) {
        // If the file doesn't exist, Firebase throws a "not-found" error.
        // We can safely ignore this as the end result is the same: the file is gone.
        if (error.code === 404) {
            console.log(`File not found, skipping deletion: ${public_id}`);
            return;
        }
        // For other errors, we re-throw them to be caught by the main handler.
        throw error;
    }
}


export async function POST(req: NextRequest) {
  try {
    const { public_id } = await req.json();

    if (!public_id) {
      return NextResponse.json({ error: 'Public ID is required.' }, { status: 400 });
    }
    
    // Do not attempt to delete images from google user content
    if (public_id.startsWith('google_')) {
        return NextResponse.json({ message: 'Skipping deletion for Google content.' });
    }

    await deleteFromFirebaseStorage(public_id);
    
    return NextResponse.json({ message: 'Image deleted successfully.' });
  } catch (error: any) {
    console.error("Firebase Storage Deletion Error:", error);
    return NextResponse.json({ error: `Deletion failed: ${error.message}` }, { status: 500 });
  }
}
