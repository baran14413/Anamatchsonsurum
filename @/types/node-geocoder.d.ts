declare module 'node-geocoder' {
    import { RequestOptions } from 'http';

    namespace NodeGeocoder {
        interface Options {
            provider:
                | 'google'
                | 'freegeoip'
                | 'datasciencetoolkit'
                | 'locationiq'
                | 'mapquest'
                | 'openstreetmap'
                | 'agol'
                | 'nominatimmapquest'
                | 'opencage'
                | 'geocodio'
                | 'yandex'
                | 'teleport'
                | 'here';
            httpAdapter?: 'https' | 'http' | 'request' | undefined;
            timeout?: number | undefined;
            apiKey?: string | undefined;
            formatter?: null | 'gpx' | 'string' | undefined;
            formatterPattern?: string | undefined;
            [key: string]: any;
        }

        interface Location {
            lat: number;
            lon: number;
        }

        interface Query {
            address: string;
            country?: string | undefined;
            countryCode?: string | undefined;
            zipcode?: string | undefined;
            limit?: number | undefined;
            language?: string | undefined;
            minConfidence?: number | undefined;
        }

        interface Entry {
            provider: string;
            latitude: number;
            longitude: number;
            country: string;
            city: string | null;
            zipcode: string;
            streetName: string | null;
            streetNumber: string | null;
            state: string;
            stateCode: string;
            countryCode: string;
            administrativeLevels?: {
                level1long: string;
                level1short: string;
                level2long: string;
                level2short: string;
            } | undefined;
            formattedAddress?: string | undefined;
            extra?:
                | {
                      googlePlaceId?: string | undefined;
                      confidence?: number | undefined;
                      premise?: string | undefined;
                      subpremise?: string | undefined;
                      neighborhood?: string | undefined;
                      establishment?: string | undefined;
                  }
                | undefined;
            district?: string;
        }

        interface Geocoder {
            geocode(
                query: string | Query,
                cb?: (err: any, data: Entry[]) => void,
            ): Promise<Entry[]>;
            reverse(
                loc: Location,
                cb?: (err: any, data: Entry[]) => void,
            ): Promise<Entry[]>;
        }
    }

    function NodeGeocoder(options: NodeGeocoder.Options): NodeGeocoder.Geocoder;

    export = NodeGeocoder;
}
