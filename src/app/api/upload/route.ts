
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for temporary file storage
const upload = multer({ dest: '/tmp' });

// Helper to run middleware
const runMiddleware = (req: NextRequest, fn: Function) => {
  return new Promise((resolve, reject) => {
    fn(req, new NextResponse(), (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: any) {
  try {
    // We need to use a custom middleware wrapper because Next.js 14 doesn't
    // support Express middleware out of the box in Route Handlers.
    await new Promise<void>((resolve, reject) => {
      const multerUpload = upload.single('file');
      // @ts-ignore
      multerUpload(req, new NextResponse(), (err: any) => {
        if (err) {
          console.error("Multer error:", err);
          return reject(new Error('File processing error: ' + err.message));
        }
        resolve();
      });
    });

    const file = req.file;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }
    
    const isVideo = file.mimetype.startsWith('video/');
    
    const uploadOptions: any = {
      folder: 'bematch_profiles',
      resource_type: isVideo ? 'video' : 'image',
    };

    // Use the file path provided by multer for direct upload
    const result = await cloudinary.uploader.upload(file.path, uploadOptions);

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
    });

  } catch (error: any) {
    console.error("Cloudinary Upload Error:", error);
    return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
  }
}
