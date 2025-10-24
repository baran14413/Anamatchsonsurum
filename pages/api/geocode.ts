
import type { NextApiRequest, NextApiResponse } from 'next';
import NodeGeocoder from 'node-geocoder';

const options: NodeGeocoder.Options = {
    provider: 'openstreetmap'
};

const geocoder = NodeGeocoder(options);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*'); // Or a specific origin
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { lat, lon } = req.query;

    if (typeof lat !== 'string' || typeof lon !== 'string') {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    try {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        if (isNaN(latitude) || isNaN(longitude)) {
             return res.status(400).json({ error: 'Invalid latitude or longitude format' });
        }

        const geoRes = await geocoder.reverse({ lat: latitude, lon: longitude });

        if (geoRes && geoRes.length > 0) {
            const { country, countryCode, city, state } = geoRes[0];
            return res.status(200).json({ country, countryCode, city, state });
        } else {
            return res.status(404).json({ error: 'Location not found' });
        }
    } catch (error: any) {
        console.error('Geocoding error:', error);
        return res.status(500).json({ error: `Geocoding failed: ${error.message}` });
    }
}
