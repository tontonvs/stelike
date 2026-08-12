// Shared convention for a "shared location" delivery address: rather than a
// typed street address, it's stored as this prefix + a Google Maps link built
// from the browser's free Geolocation API (no paid geocoding API involved).
const GPS_PREFIX = "GPS location: ";

export function isGpsAddress(address: string): boolean {
  return address.startsWith(GPS_PREFIX);
}

export function formatGpsAddress(lat: number, lng: number): string {
  return `${GPS_PREFIX}https://www.google.com/maps?q=${lat},${lng}`;
}

export function gpsMapsUrl(address: string): string {
  return address.slice(GPS_PREFIX.length);
}
