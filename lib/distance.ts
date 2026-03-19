/**
 * Cálculo de distancias usando fórmula Haversine
 * Para calcular distancias entre estadios/ciudades
 */

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calcula la distancia en kilómetros entre dos puntos geográficos
 * usando la fórmula de Haversine.
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Verifica si unas coordenadas están dentro del radio del estadio.
 * @param userLat - Latitud del usuario
 * @param userLng - Longitud del usuario
 * @param stadiumLat - Latitud del estadio
 * @param stadiumLng - Longitud del estadio
 * @param radiusMeters - Radio máximo permitido en metros
 */
export function isWithinStadiumRadius(
  userLat: number,
  userLng: number,
  stadiumLat: number,
  stadiumLng: number,
  radiusMeters: number,
): boolean {
  const distanceKm = haversineDistanceKm(userLat, userLng, stadiumLat, stadiumLng);
  return distanceKm * 1000 <= radiusMeters;
}

/**
 * Coordenadas de Santiago de Chile (punto de referencia para distancias internacionales)
 */
export const CHILE_REFERENCE_COORDS = {
  lat: -33.4489,
  lng: -70.6693,
};
