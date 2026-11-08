/**
 * InfraLens Geolocation Service
 *
 * Provides:
 * 1. navigator.geolocation API wrapper
 * 2. EXIF GPS extraction from image files
 * 3. Reverse geocoding via OpenStreetMap Nominatim (free, no API key required)
 * 4. Address parsing into InfraLens location fields
 *
 * No coordinates are invented or hardcoded here.
 * If a location cannot be determined, the service returns null and the UI
 * falls back to a manual pin-drop map.
 */

export interface ResolvedLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  gpsSource: 'DEVICE_GPS' | 'EXIF_METADATA' | 'CITIZEN_MOBILE' | 'UNVERIFIED_PROVISIONAL';
  address: string;
  ward?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  roadName?: string;
  locality?: string;
  locationVerificationStatus: 'VERIFIED_GEOCODED' | 'UNVERIFIED_PROVISIONAL';
  timestamp: string;
}

export interface GeoError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'EXIF_NO_GPS' | 'GEOCODING_FAILED';
  message: string;
}

export class GeoLocationService {
  private static readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
  private static readonly NOMINATIM_HEADERS = {
    'Accept': 'application/json',
    'User-Agent': 'InfraLens-CivicPlatform/1.0 (infralens@civic.gov.in)',
  };

  /**
   * Request device GPS location.
   * Returns null if the browser does not support geolocation or the user denies permission.
   * Never fabricates coordinates.
   */
  static async requestDeviceLocation(): Promise<ResolvedLocation | GeoError> {
    if (!navigator.geolocation) {
      return {
        code: 'POSITION_UNAVAILABLE',
        message: 'Geolocation is not supported by this browser.',
      };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const geocoded = await GeoLocationService.reverseGeocode(latitude, longitude);

          resolve({
            latitude,
            longitude,
            accuracyMeters: Math.round(accuracy),
            gpsSource: 'DEVICE_GPS',
            address: geocoded?.address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            ward: geocoded?.ward,
            city: geocoded?.city,
            district: geocoded?.district,
            state: geocoded?.state,
            pincode: geocoded?.pincode,
            roadName: geocoded?.roadName,
            locality: geocoded?.locality,
            locationVerificationStatus: geocoded ? 'VERIFIED_GEOCODED' : 'UNVERIFIED_PROVISIONAL',
            timestamp: new Date().toISOString(),
          });
        },
        (error) => {
          let code: GeoError['code'] = 'POSITION_UNAVAILABLE';
          if (error.code === 1) code = 'PERMISSION_DENIED';
          if (error.code === 3) code = 'TIMEOUT';

          resolve({
            code,
            message: error.message || 'Could not obtain GPS location.',
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        }
      );
    });
  }

  /**
   * Reverse geocode a lat/lng pair using OpenStreetMap Nominatim.
   * Returns structured address fields. Returns null on network failure.
   */
  static async reverseGeocode(lat: number, lon: number): Promise<Omit<ResolvedLocation, 'latitude' | 'longitude' | 'accuracyMeters' | 'gpsSource' | 'locationVerificationStatus' | 'timestamp'> | null> {
    try {
      const url = `${GeoLocationService.NOMINATIM_URL}?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=18`;

      const response = await fetch(url, {
        headers: GeoLocationService.NOMINATIM_HEADERS,
      });

      if (!response.ok) {
        console.warn('[GeoLocationService] Nominatim reverse geocode failed:', response.status);
        return null;
      }

      const data = await response.json();
      const a = data.address || {};

      const roadName = a.road || a.pedestrian || a.path || a.cycleway || '';
      const locality = a.suburb || a.neighbourhood || a.quarter || a.village || '';
      const city = a.city || a.town || a.municipality || a.village || '';
      const district = a.county || a.state_district || a.district || city;
      const state = a.state || '';
      const pincode = a.postcode || '';

      // Build human-readable address
      const parts = [
        roadName,
        locality,
        city,
        district !== city ? district : '',
        state,
        pincode,
        'India',
      ].filter(Boolean);
      const address = data.display_name || parts.join(', ');

      return {
        address,
        roadName,
        locality,
        city,
        district,
        state,
        pincode,
      };
    } catch (err) {
      console.warn('[GeoLocationService] Reverse geocoding network error:', err);
      return null;
    }
  }

  /**
   * Forward geocode an address string to coordinates.
   * Used for manual location search.
   */
  static async searchAddress(query: string): Promise<{ lat: number; lon: number; display_name: string }[]> {
    try {
      const encoded = encodeURIComponent(query + ', India');
      const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=5&addressdetails=1`;

      const response = await fetch(url, {
        headers: GeoLocationService.NOMINATIM_HEADERS,
      });

      if (!response.ok) return [];
      const results = await response.json();

      return results.map((r: { lat: string; lon: string; display_name: string }) => ({
        lat: parseFloat(r.lat),
        lon: parseFloat(r.lon),
        display_name: r.display_name,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Extract GPS coordinates from an image file's EXIF metadata.
   * Returns null if the image has no embedded GPS data.
   * Does NOT fabricate coordinates.
   */
  static async extractExifGps(file: File): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          if (!buffer) { resolve(null); return; }

          const dataView = new DataView(buffer);

          // Check JPEG SOI marker
          if (dataView.getUint16(0) !== 0xFFD8) { resolve(null); return; }

          let offset = 2;
          while (offset < dataView.byteLength - 2) {
            const marker = dataView.getUint16(offset);
            if (marker === 0xFFE1) {
              // APP1 (EXIF)
              const length = dataView.getUint16(offset + 2);
              const exifStart = offset + 4;

              // Check "Exif" identifier
              const exifHeader = String.fromCharCode(
                dataView.getUint8(exifStart),
                dataView.getUint8(exifStart + 1),
                dataView.getUint8(exifStart + 2),
                dataView.getUint8(exifStart + 3)
              );

              if (exifHeader !== 'Exif') { resolve(null); return; }

              const tiffStart = exifStart + 6;
              const isLittleEndian = dataView.getUint16(tiffStart) === 0x4949;
              const getUint16 = (o: number) => dataView.getUint16(tiffStart + o, isLittleEndian);
              const getUint32 = (o: number) => dataView.getUint32(tiffStart + o, isLittleEndian);

              const ifdOffset = getUint32(4);
              const numEntries = getUint16(ifdOffset);

              let gpsIfdOffset: number | null = null;

              for (let i = 0; i < numEntries; i++) {
                const entryOffset = ifdOffset + 2 + i * 12;
                const tag = getUint16(entryOffset);
                if (tag === 0x8825) { // GPS IFD pointer
                  gpsIfdOffset = getUint32(entryOffset + 8);
                  break;
                }
              }

              if (gpsIfdOffset === null) { resolve(null); return; }

              const gpsEntries = getUint16(gpsIfdOffset);
              let latRef: string | null = null;
              let lonRef: string | null = null;
              let lat: number | null = null;
              let lon: number | null = null;

              const readRational = (off: number): number => {
                const num = getUint32(off);
                const den = getUint32(off + 4);
                return den === 0 ? 0 : num / den;
              };

              for (let i = 0; i < gpsEntries; i++) {
                const eOff = gpsIfdOffset + 2 + i * 12;
                const tag = getUint16(eOff);
                const valOffset = getUint32(eOff + 8);

                if (tag === 0x0001) { // GPSLatitudeRef
                  latRef = String.fromCharCode(dataView.getUint8(tiffStart + eOff - gpsIfdOffset + 2 + i * 12 + 8));
                } else if (tag === 0x0003) { // GPSLongitudeRef
                  lonRef = String.fromCharCode(dataView.getUint8(tiffStart + eOff - gpsIfdOffset + 2 + i * 12 + 8));
                } else if (tag === 0x0002) { // GPSLatitude
                  const degrees = readRational(valOffset);
                  const minutes = readRational(valOffset + 8);
                  const seconds = readRational(valOffset + 16);
                  lat = degrees + minutes / 60 + seconds / 3600;
                } else if (tag === 0x0004) { // GPSLongitude
                  const degrees = readRational(valOffset);
                  const minutes = readRational(valOffset + 8);
                  const seconds = readRational(valOffset + 16);
                  lon = degrees + minutes / 60 + seconds / 3600;
                }
              }

              if (lat !== null && lon !== null) {
                if (latRef === 'S') lat = -lat;
                if (lonRef === 'W') lon = -lon;
                resolve({ latitude: lat, longitude: lon });
              } else {
                resolve(null);
              }
              return;
            }

            if (offset + 2 >= dataView.byteLength) break;
            const segLen = dataView.getUint16(offset + 2);
            offset += 2 + segLen;
          }

          resolve(null);
        } catch {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsArrayBuffer(file.slice(0, 65536)); // Read first 64KB for EXIF
    });
  }

  /** Check if a result is an error */
  static isError(result: ResolvedLocation | GeoError): result is GeoError {
    return 'code' in result && 'message' in result;
  }
}
