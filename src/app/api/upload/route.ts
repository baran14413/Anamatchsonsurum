
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(file: File): Promise<any> {
    const fileBuffer = await file.arrayBuffer();
    const mime = file.type;
    const encoding = 'base64';
    const base64Data = Buffer.from(fileBuffer).toString('base64');
    const fileUri = 'data:' + mime + ';' + encoding + ',' + base64Data;

    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
            fileUri,
            {
                folder: 'bematch_profiles',
                resource_type: 'auto', // Let Cloudinary detect if it's an image or audio
            },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary Upload Error:", error);
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );
    });
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
        }
        
        const result = await uploadToCloudinary(file);

        return NextResponse.json({
            url: result.secure_url,
            public_id: result.public_id,
            resource_type: result.resource_type,
        });

    } catch (error: any) {
        console.error("API Route Upload Error:", error);
        return NextResponse.json(
          { error: `Upload failed on server: ${error.message || 'Unknown error'}` }, 
          { status: 500 }
        );
    }
}
