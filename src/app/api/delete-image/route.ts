
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function POST(req: NextRequest) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    const { public_id } = await req.json();

    if (!public_id) {
      return NextResponse.json({ error: 'Public ID is required.' }, { status: 400 });
    }
    
    // Do not attempt to delete images from google user content
    if (public_id.startsWith('google_')) {
        return NextResponse.json({ message: 'Skipping deletion for Google content.' });
    }
    
    const result = await cloudinary.uploader.destroy(public_id);
    
    if (result.result !== 'ok' && result.result !== 'not found') {
        throw new Error(result.result);
    }

    return NextResponse.json({ message: 'Image deleted successfully.' });
  } catch (error: any) {
    console.error("Cloudinary Deletion Error:", error);
    return NextResponse.json({ error: `Deletion failed: ${error.message}` }, { status: 500 });
  }
}
