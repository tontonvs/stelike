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

/** Pulls the raw coordinates back out of a stored GPS address string. */
export function extractLatLng(address: string): { lat: number; lng: number } | null {
  const match = address.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (!match) return null;
  return { lat: Number(match[1]), lng: Number(match[2]) };
}

/** Free OpenStreetMap embed for a small preview thumbnail — no API key, no
 * billing account, unlike Google's Embed API which now requires both even on
 * its free tier. The actual "get directions" link should still point to
 * Google Maps (gpsMapsUrl) since that's what delivery riders actually use. */
export function osmPreviewUrl(lat: number, lng: number): string {
  const delta = 0.006; // small bounding box around the pin
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&marker=${lat},${lng}&layer=mapnik`;
}
