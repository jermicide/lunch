// services/geocodeService.js
/**
 * Geocodes a ZIP code to get latitude and longitude coordinates
 * 
 * @param {string} zipCode - The ZIP code to geocode
 * @returns {Promise<Object>} - Object containing success flag, location and address info
 */
export const geocodeZipCode = async (zipCode) => {
    try {
      const response = await fetch(`/api/geocode?zipCode=${zipCode}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to geocode ZIP code');
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          success: true,
          location: {
            lat: location.lat,
            lng: location.lng
          },
          address: data.results[0].formatted_address
        };
      } else {
        return {
          success: false,
          error: 'No results found for this ZIP code'
        };
      }
    } catch (error) {
      console.error('Error in geocodeZipCode:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };