const EARTH_RADIUS_MILES = 3958.8

export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_MILES * 2 * Math.asin(Math.sqrt(a))
}

export function isWithinRadius(
  driverLat: number, driverLng: number,
  riderLat: number, riderLng: number,
  radiusMiles: number,
): boolean {
  return haversineDistance(driverLat, driverLng, riderLat, riderLng) <= radiusMiles
}
