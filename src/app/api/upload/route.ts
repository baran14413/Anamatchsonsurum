
import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/firebase/admin';

export const runtime = 'nodejs';

async function uploadToFirebaseStorage(file: File): Promise<{ url: string; public_id: string }> {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
    if (!bucketName) {
        throw new Error("Firebase Storage bucket name is not configured in environment variables.");
    }
    const bucket = storage.bucket(bucketName);

    const fileBuffer = await file.arrayBuffer();
    
    const uniqueFileName = `bematch_profiles/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const storageRef = bucket.file(uniqueFileName);

    await storageRef.save(Buffer.from(fileBuffer), {
        metadata: {
            contentType: file.type,
        },
    });

    // Make the file public to get a public URL
    await storageRef.makePublic();
    
    // Get the public URL
    const downloadURL = storageRef.publicUrl();

    return {
        url: downloadURL,
        public_id: uniqueFileName,
    };
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
        }
        
        const result = await uploadToFirebaseStorage(file);

        return NextResponse.json({
            url: result.url,
            public_id: result.public_id,
            resource_type: file.type.startsWith('image/') ? 'image' : 'raw',
        });

    } catch (error: any) {
        console.error("API Route Upload Error:", error);
        return NextResponse.json(
          { error: `Upload failed on server: ${error.message || 'Unknown error'}` }, 
          { status: 500 }
        );
    }
}
