// API function for proxying Google Places API requests
module.exports = async function (context, req) {
  context.log('Processing places API request');
  
  try {
      const { lat, lng } = req.query;
      
      if (!lat || !lng) {
          context.res = {
              status: 400,
              body: { error: "Missing location coordinates" }
          };
          return;
      }
      
      const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
      if (!GOOGLE_API_KEY) {
          context.log.error("Missing Google API Key configuration");
          context.res = {
              status: 500,
              body: { error: "Server configuration error" }
          };
          return;
      }
      
      // Using Google Places API V2 (new version)
      const url = 'https://places.googleapis.com/v1/places:searchNearby';
      
      const searchParams = {
          includedTypes: ["restaurant", "cafe", "bakery", "meal_takeaway", "meal_delivery"],
          maxResultCount: 12,
          locationRestriction: {
              circle: {
                  center: {
                      latitude: parseFloat(lat),
                      longitude: parseFloat(lng)
                  },
                  radius: 1500.0
              }
          },
          rankPreference: "DISTANCE",
          languageCode: "en"
      };
      
      context.log(`Fetching places near ${lat},${lng}`);
      
      const response = await fetch(url, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': GOOGLE_API_KEY,
              'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.primaryType,places.businessStatus,places.primaryTypeDisplayName,places.editorialSummary,places.photos'
          },
          body: JSON.stringify(searchParams)
      });
      
      const data = await response.json();
      
      // Handle error responses from Google
      if (data.error) {
          context.log.error(`Google API error: ${JSON.stringify(data.error)}`);
          context.res = {
              status: data.error.code || 500,
              body: { error: data.error.message || "Google API Error" }
          };
          return;
      }
      
      context.res = {
          status: 200,
          headers: {
              'Content-Type': 'application/json'
          },
          body: data
      };
      
  } catch (error) {
      context.log.error(`Error in places API: ${error.message}`);
      context.res = {
          status: 500,
          body: { error: "Failed to fetch restaurants", details: error.message }
      };
  }
};