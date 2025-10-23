
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;

  if (typeof url !== 'string') {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  try {
    const imageResponse = await fetch(url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const buffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // Convert ArrayBuffer to Base64 string
    const base64 = Buffer.from(buffer).toString('base64');
    
    // Construct data URI
    const dataUri = `data:${contentType};base64,${base64}`;

    res.status(200).json({ dataUri });
  } catch (error: any) {
    console.error('Image proxy error:', error);
    res.status(500).json({ error: `Failed to process image: ${error.message}` });
  }
}
