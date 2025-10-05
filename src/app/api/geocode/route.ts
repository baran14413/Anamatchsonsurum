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
      const address = res[0];
      // Standardize the response to always have city and district
      const responseData = {
          city: address.state, // The city is often in the 'state' field for Turkish addresses
          district: address.city || address.district, // District can be in 'city' or 'district'
          country: address.country,
      };
      return NextResponse.json({ address: responseData });
    } else {
      return NextResponse.json({ error: 'Address not found for the given coordinates' }, { status: 404 });
    }
  } catch (error) {
    console.error('Geocoding API error:', error);
    // Provide a more generic error to the client
    return NextResponse.json({ error: 'Failed to fetch address' }, { status: 500 });
  }
}
