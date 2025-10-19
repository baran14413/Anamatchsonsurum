
import { NextRequest, NextResponse } from 'next/server';
import NodeGeocoder from 'node-geocoder';

const geocoder = NodeGeocoder({
  provider: 'openstreetmap',
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const addressQuery = searchParams.get('address');

  if (lat && lon) {
    try {
      const res = await geocoder.reverse({ lat: parseFloat(lat), lon: parseFloat(lon) });
      if (res && res.length > 0) {
        const address = res[0];
        const city = address.city || address.district || (address.administrativeLevels as any)?.level2long || address.county || (address.administrativeLevels as any)?.level1long;

        if (!city && !address.countryCode) {
            console.warn("Could not determine city or country from geocoder response:", address);
            return NextResponse.json({ error: 'Address not found' }, { status: 404 });
        }

        const responseData = {
            city: city || null,
            country: address.countryCode,
        };
        return NextResponse.json({ address: responseData });
      } else {
        return NextResponse.json({ error: 'Address not found' }, { status: 404 });
      }
    } catch (error) {
      console.error('Reverse Geocoding API error:', error);
      return NextResponse.json({ error: 'Failed to fetch address from coordinates' }, { status: 500 });
    }
  } else if (addressQuery) {
    try {
      const res = await geocoder.geocode({
        address: addressQuery,
        limit: 5,
      });
      return NextResponse.json({ addresses: res });
    } catch (error) {
      console.error('Forward Geocoding API error:', error);
      return NextResponse.json({ error: 'Failed to fetch address from query' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: 'Either lat/lon or an address query parameter is required' }, { status: 400 });
  }
}
