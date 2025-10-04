import { NextRequest, NextResponse } from 'next/server';
import NodeGeocoder from 'node-geocoder';

const options: NodeGeocoder.Options = {
  provider: 'openstreetmap',
};

const geocoder = NodeGeocoder(options);

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
      // Return the entire first result object.
      // The client will be responsible for formatting it.
      return NextResponse.json({ address: res[0] });
    } else {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json({ error: 'Failed to fetch address' }, { status: 500 });
  }
}
