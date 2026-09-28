// src/utils/geofence.ts
// Perhitungan jarak GPS (Haversine Formula) untuk validasi radius absensi sekolah

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius bumi dalam meter
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
}

export function isWithinSchoolGeofence(
  userLat: number,
  userLon: number,
  schoolLat: number,
  schoolLon: number,
  allowedRadiusMeters: number
): { isWithin: boolean; distanceMeters: number } {
  const distance = calculateDistanceMeters(userLat, userLon, schoolLat, schoolLon);
  return {
    isWithin: distance <= allowedRadiusMeters,
    distanceMeters: distance,
  };
}
