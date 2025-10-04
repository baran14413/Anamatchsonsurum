
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

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper to run multer middleware
const runMiddleware = (req: NextRequest, res: NextResponse, fn: any) => {
  return new Promise((resolve, reject) => {
    // We need to convert NextRequest to something that Express/Multer understands
    const expressReq = req as any;
    expressReq.headers = Object.fromEntries(req.headers);
    
    // We need to add the file stream to the request
    if (req.body) {
        expressReq.pipe = req.body.pipe.bind(req.body);
        expressReq.unpipe = req.body.unpipe.bind(req.body);
        expressReq.on = req.body.on.bind(req.body);
        expressReq.once = req.body.once.bind(req.body);
        expressReq.removeListener = req.body.removeListener.bind(req.body);
        expressReq.off = req.body.off.bind(req.body);
        expressReq.removeAllListeners = req.body.removeAllListeners.bind(req.body);
    }
    
    fn(expressReq, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};


export async function POST(req: NextRequest) {
  const res = new NextResponse();

  try {
    await runMiddleware(req, res, upload.single('file'));
    const file = (req as any).file;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const uploadPromise = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'bematch_profiles' },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        }
      );

      const readableStream = new Readable();
      readableStream._read = () => {};
      readableStream.push(file.buffer);
      readableStream.push(null);
      readableStream.pipe(stream);
    });

    const result: any = await uploadPromise;

    return NextResponse.json({ url: result.secure_url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Disable the default body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};
