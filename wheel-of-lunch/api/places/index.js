const { Client } = require('@googlemaps/google-maps-services-js');

/**
 * Validates latitude and longitude coordinates
 * @param {number} latitude
 * @param {number} longitude
 * @returns {boolean}
 */
function isValidCoordinates(latitude, longitude) {
    return (
        !isNaN(latitude) &&
        !isNaN(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
    );
}

/**
 * Validates and constrains search radius
 * @param {string|number} radius
 * @returns {number}
 */
function normalizeRadius(radius) {
    const parsed = Number(radius) || 1500;
    const MIN_RADIUS = 500;
    const MAX_RADIUS = 50000;
    return Math.min(Math.max(parsed, MIN_RADIUS), MAX_RADIUS);
}

/**
 * Types to exclude from results (gas stations, convenience stores, big box stores, etc.)
 */
const EXCLUDED_TYPES = new Set([
    'gas_station',
    'convenience_store',
    'department_store',
    'supermarket',
    'shopping_mall',
    'grocery_or_supermarket',
    'car_rental',
    'car_repair',
    'car_wash',
    'parking',
    'automotive_repair_shop',
    'hardware_store',
    'home_improvement_store',
    'furniture_store',
    'clothing_store',
    'pharmacy',
    'health_and_beauty'
]);

/**
 * Checks if a place is a valid restaurant and not a gas station, convenience store, or big box store
 * @param {Object} place - Google Place object
 * @returns {boolean} - True if place is a restaurant only
 */
function isValidRestaurant(place) {
    // Must have the restaurant type
    const types = place.types || [];
    const hasRestaurantType = types.includes('restaurant');

    if (!hasRestaurantType) {
        return false;
    }

    // Exclude places with unwanted types
    const hasExcludedType = types.some((type) => EXCLUDED_TYPES.has(type));

    return !hasExcludedType;
}

/**
 * Maps Google Places SDK response to normalized format
 * @param {Object} place
 * @returns {Object}
 */
function mapPlaceResponse(place) {
    return {
        id: place.place_id,
        displayName: place.name,
        formattedAddress: place.vicinity,
        location: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng
        },
        rating: place.rating || null,
        userRatingCount: place.user_ratings_total || 0,
        priceLevel: place.price_level || null,
        primaryType: place.types?.[0] || null,
        businessStatus: place.business_status || null,
        photos: (place.photos || []).map(photo => ({
            name: photo.photo_reference,
            widthPx: photo.width,
            heightPx: photo.height
        }))
    };
}

/**
 * Azure Function: Fetch nearby restaurants using Google Places API
 * @param {Object} context - Azure Function context
 * @param {Object} req - HTTP request
 */
module.exports = async function (context, req) {
    context.log('Processing places API request');

    try {
        const { lat, lng, radius = 1500 } = req.query;

        // Validate latitude and longitude
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        if (!isValidCoordinates(latitude, longitude)) {
            context.res = {
                status: 400,
                body: { error: 'Invalid or missing location coordinates' }
            };
            return;
        }

        // Validate API key exists
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        if (!GOOGLE_API_KEY) {
            context.log.error('Missing Google API Key configuration');
            context.res = {
                status: 500,
                body: { error: 'Server configuration error' }
            };
            return;
        }

        const searchRadius = normalizeRadius(radius);
        context.log(`Fetching restaurants near ${latitude},${longitude}`);

        // Initialize Google Maps client
        const client = new Client({});

        // Build request parameters
        const params = {
            location: { lat: latitude, lng: longitude },
            key: GOOGLE_API_KEY,
            language: 'en',
            type: 'restaurant'
        };

        // Use radius or rankby:distance, not both
        // Note: rankby=distance requires at least one of keyword, name, or type (we use type=restaurant)
        // and does NOT support radius parameter
        if (req.query.rankBy === 'distance') {
            // When using rankby=distance, we cannot use radius
            params.rankby = 'distance';
            context.log('Using distance-based ranking (rankby=distance) without radius');
        } else {
            // When using radius-based search
            params.radius = searchRadius;
            context.log(`Using radius-based search with radius=${searchRadius}m`);
        }

        const response = await client.placesNearby({ params });
        const data = response.data;

        context.log(
            `Places API Response - Status: ${data.status}, Places found: ${data.results?.length || 0}`
        );

        // Handle error responses from Google
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            context.log.error(`Google Places API error: ${data.status}`);
            context.res = {
                status: 400,
                body: {
                    error: 'Google Places API error',
                    status: data.status
                }
            };
            return;
        }

        // Filter to only valid restaurants, excluding gas stations, convenience stores, and big box stores
        const validResults = (data.results || []).filter(isValidRestaurant);
        context.log(
            `Filtered results: ${validResults.length} restaurants from ${data.results?.length || 0} total places`
        );

        // Map and return valid restaurant places
        const places = validResults.map(mapPlaceResponse);

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: { places }
        };
    } catch (error) {
        context.log.error(`Places API error: ${error.message}`);
        context.log.error(`Error type: ${error.name}`);
        context.log.error(`Stack: ${error.stack}`);

        if (error.response) {
            context.log.error(`Response status: ${error.response.status}`);
            context.log.error(`Response data: ${JSON.stringify(error.response.data)}`);
        }

        context.res = {
            status: 500,
            body: {
                error: 'Failed to fetch restaurants',
                message: error.message
            }
        };
    }
};