// services/restaurantService.js
/**
 * Fetches restaurant data from the Google Places API via server endpoint
 * 
 * @param {Object} userLocation - User's location with lat and lng properties
 * @param {number} searchRadius - Search radius in meters
 * @param {string} rankBy - Ranking method ('radius' or 'distance')
 * @returns {Promise<Array>} - Formatted restaurant list
 */
export const fetchRestaurantsData = async (userLocation, searchRadius, rankBy) => {
    try {
      const queryParams = new URLSearchParams({
        lat: userLocation.lat,
        lng: userLocation.lng,
        ...(rankBy === 'radius' && { radius: searchRadius }),
        ...(rankBy === 'distance' && { rankBy: 'distance' })
      });
      
      const response = await fetch(`/api/places?${queryParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch restaurants');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.details || data.error);
      }
      
      if (!data.places || !Array.isArray(data.places) || data.places.length === 0) {
        return [];
      }
      
      return data.places.map(place => ({
        id: place.id || `place-${Math.random().toString(36).substring(2, 9)}`,
        name: place.displayName || 'Unnamed Restaurant',
        rating: place.rating || 0,
        price_level: place.priceLevel || 1,
        address: place.formattedAddress || '',
        photo_reference: place.photos?.[0]?.name || null,
        review_count: place.userRatingCount || 0,
        category: place.primaryType || 'Restaurant',
        description: '',
        business_status: place.businessStatus || 'OPERATIONAL',
        location: place.location
      }));
    } catch (error) {
      console.error('Error in fetchRestaurantsData:', error);
      throw error;
    }
  };