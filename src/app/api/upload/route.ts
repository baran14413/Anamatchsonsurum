
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { promisify } from 'util';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper to run middleware
function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// We need to disable the default body parser for multer to work
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: any) {
  const res = new NextResponse();
  try {
    // Run the multer middleware
    await runMiddleware(req, res, upload.single('file'));
    
    // After middleware, req.file will be populated
    const file = req.file;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }
    
    // Create a data URI from the buffer
    const b64 = Buffer.from(file.buffer).toString('base64');
    let dataURI = "data:" + file.mimetype + ";base64," + b64;
    
    // Upload the data URI to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'bematch_profiles',
      resource_type: 'image',
    });

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
    });

  } catch (error: any) {
    console.error("Cloudinary Upload Error:", error);
    // Use the file name from the multer file object for a more descriptive error
    const fileName = error.file?.originalname || 'the file';
    return NextResponse.json(
      { error: `'${fileName}' yüklenemedi. ${error.message}` }, 
      { status: 500 }
    );
  }
}
