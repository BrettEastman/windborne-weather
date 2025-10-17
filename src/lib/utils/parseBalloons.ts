import type { BalloonPoint } from "$lib/types";

/**
 * Validates a single balloon data point
 * Returns true if all checks pass, false otherwise
 */
export function isValidBalloonPoint(entry: unknown): entry is BalloonPoint {
  if (!Array.isArray(entry)) return false;

  // Must have exactly 3 elements
  if (entry.length !== 3) return false;

  const [lat, lon, altitude] = entry;

  // All must be valid numbers
  if (typeof lat !== "number" || isNaN(lat)) return false;
  if (typeof lon !== "number" || isNaN(lon)) return false;
  if (typeof altitude !== "number" || isNaN(altitude)) return false;

  // Latitude bounds: -90 to 90
  if (lat < -90 || lat > 90) return false;

  // Longitude bounds: -180 to 180
  if (lon < -180 || lon > 180) return false;

  // Altitude bounds: 0 to 50000 meters (reasonable atmospheric bounds)
  if (altitude < 0 || altitude > 50000) return false;

  return true;
}

/**
 * Filters and validates balloon data points
 * Returns validated points and count of rejected entries
 */
export function validateBalloonData(data: unknown[]): {
  validPoints: BalloonPoint[];
  errorCount: number;
} {
  let errorCount = 0;
  const validPoints: BalloonPoint[] = [];

  for (const entry of data) {
    if (isValidBalloonPoint(entry)) {
      validPoints.push(entry);
    } else {
      errorCount++;
    }
  }

  return { validPoints, errorCount };
}
