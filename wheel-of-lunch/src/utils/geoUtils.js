// utils/geoUtils.js
/**
 * Calculates the distance between two geographic points using the Haversine formula
 * 
 * @param {Object} point1 - First point with lat/latitude and lng/longitude properties
 * @param {Object} point2 - Second point with lat/latitude and lng/longitude properties
 * @returns {number} - Distance in miles
 */
export const calculateDistance = (point1, point2) => {
    const lat1 = point1.lat || point1.latitude;
    const lng1 = point1.lng || point1.longitude;
    const lat2 = point2.lat || point2.latitude;
    const lng2 = point2.lng || point2.longitude;
    
    // Radius of the Earth in miles
    const earthRadius = 3958.8;
    
    // Convert latitude and longitude from degrees to radians
    const latRad1 = (lat1 * Math.PI) / 180;
    const lngRad1 = (lng1 * Math.PI) / 180;
    const latRad2 = (lat2 * Math.PI) / 180;
    const lngRad2 = (lng2 * Math.PI) / 180;
    
    // Calculate differences
    const diffLat = latRad2 - latRad1;
    const diffLng = lngRad2 - lngRad1;
    
    // Haversine formula
    const a = 
      Math.sin(diffLat / 2) * Math.sin(diffLat / 2) +
      Math.cos(latRad1) * Math.cos(latRad2) * 
      Math.sin(diffLng / 2) * Math.sin(diffLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;
    
    return distance;
  };