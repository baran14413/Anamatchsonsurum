import { NextRequest, NextResponse } from 'next/server';
import NodeGeocoder from 'node-geocoder';

// It's better to initialize the geocoder once.
const geocoder = NodeGeocoder({
  provider: 'openstreetmap',
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  try {
    const res = await geocoder.reverse({ lat: parseFloat(lat), lon: parseFloat(lon) });
    
    if (res && res.length > 0) {
      // The first result is usually the most accurate.
      // The client can decide how to format this.
      return NextResponse.json({ address: res[0] });
    } else {
      return NextResponse.json({ error: 'Address not found for the given coordinates' }, { status: 404 });
    }
  } catch (error) {
    console.error('Geocoding API error:', error);
    // Provide a more generic error to the client
    return NextResponse.json({ error: 'Failed to fetch address' }, { status: 500 });
  }
}
