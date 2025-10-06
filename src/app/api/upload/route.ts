
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary at the top level to ensure env vars are loaded
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// This is a workaround for a bug in Next.js where the body is not parsed correctly
// See: https://github.com/vercel/next.js/discussions/54128
async function getFileFromRequest(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get('file');
    if (file instanceof File) {
        return file;
    }
    return null;
}

export async function POST(req: NextRequest) {
  try {
    const file = await getFileFromRequest(req);
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const isVideo = file.type.startsWith('video/');
    
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadOptions: any = { folder: 'bematch_profiles' };
      if (isVideo) {
        uploadOptions.resource_type = 'video';
      }
      
      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        }
      );

      const readableStream = new Readable();
      readableStream.push(Buffer.from(fileBuffer));
      readableStream.push(null);
      readableStream.pipe(stream);
    });

    const result: any = await uploadPromise;

    return NextResponse.json({ url: result.secure_url, public_id: result.public_id, resource_type: result.resource_type });
  } catch (error: any) {
    console.error("Cloudinary Upload Error:", error);
    return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
  }
}
