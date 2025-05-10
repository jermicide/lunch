module.exports = async function (context, req) {
    const { zipCode } = req.query;
    
    if (!zipCode) {
      context.res = {
        status: 400,
        body: { error: "Missing ZIP code" }
      };
      return;
    }
    
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zipCode)}&key=${GOOGLE_API_KEY}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      // Check if the geocoding was successful
      if (data.status !== 'OK') {
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
        body: data
      };
    } catch (error) {
      context.log.error('Error geocoding ZIP code:', error);
      context.res = {
        status: 500,
        body: { error: "Failed to geocode ZIP code" }
      };
    }
  };