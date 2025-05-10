module.exports = async function (context, req) {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      context.res = {
        status: 400,
        body: { error: "Missing location coordinates" }
      };
      return;
    }
    
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1500&type=restaurant&key=${GOOGLE_API_KEY}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      context.res = {
        status: 200,
        body: data
      };
    } catch (error) {
      context.res = {
        status: 500,
        body: { error: "Failed to fetch restaurants" }
      };
    }
  };