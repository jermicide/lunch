// API function for proxying Google Geocoding API requests
module.exports = async function (context, req) {
  context.log('Processing geocode API request');
  
  try {
      const { zipCode } = req.query;
      
      if (!zipCode) {
          context.res = {
              status: 400,
              body: { error: "Missing ZIP code" }
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
      
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zipCode)}&key=${GOOGLE_API_KEY}`;
      
      context.log(`Geocoding ZIP code: ${zipCode}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      // Check if the geocoding was successful
      if (data.status !== 'OK') {
          context.log.error(`Geocoding error: ${data.status} - ${data.error_message || 'Unknown error'}`);
          context.res = {
              status: 400,
              body: { 
                  error: "Geocoding failed", 
                  status: data.status,
                  message: data.error_message || "Could not geocode the ZIP code"
              }
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
      context.log.error(`Error in geocode API: ${error.message}`);
      context.res = {
          status: 500,
          body: { error: "Failed to geocode ZIP code", details: error.message }
      };
  }
};