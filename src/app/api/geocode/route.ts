import { NextRequest, NextResponse } from 'next/server';
import NodeGeocoder from 'node-geocoder';

const geocoder = NodeGeocoder({
  provider: 'openstreetmap',
  // Optional: Add your API key here if you switch to a provider that needs one
  // apiKey: 'YOUR_API_KEY', 
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const addressQuery = searchParams.get('address');

  if (lat && lon) {
    // --- Reverse Geocoding: Coordinates to Address ---
    try {
      const res = await geocoder.reverse({ lat: parseFloat(lat), lon: parseFloat(lon) });
      if (res && res.length > 0) {
        const address = res[0];
        // OpenStreetMap can return city in different fields, try to find one that exists.
        const city = address.city || address.district || (address.administrativeLevels as any)?.level2long || address.county || (address.administrativeLevels as any)?.level1long;

        if (!city) {
            console.warn("Could not determine city from geocoder response:", address);
            // Even if city is not found, we can proceed. The client requested this.
            // Let's just return the country code if available.
             return NextResponse.json({ address: { city: null, country: address.countryCode } });
        }

        const responseData = {
            city: city,
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
    // --- Forward Geocoding: Text Query to Addresses ---
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

    