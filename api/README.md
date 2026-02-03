# Wheel of Lunch API

Serverless Azure Functions API for the Wheel of Lunch application. Provides endpoints for geocoding ZIP codes and finding nearby restaurants using Google Maps APIs.

## Architecture

The API consists of three main functions:

### 1. **Places** (`/api/places`)
Fetches nearby restaurants for a given location using Google Places API.

**Important:** Only returns actual restaurants. Automatically filters out:
- Gas stations
- Convenience stores
- Big box stores (supermarkets, department stores, shopping malls)
- Hardware and home improvement stores
- Pharmacies and health/beauty stores
- Other non-restaurant retail locations

**Query Parameters:**
- `lat` (required): Latitude (-90 to 90)
- `lng` (required): Longitude (-180 to 180)
- `radius` (optional): Search radius in meters (500-50000, default: 1500)
- `rankBy` (optional): Set to `distance` to rank by distance instead of prominence

**Response:**
```json
{
  "places": [
    {
      "id": "place_id",
      "displayName": "Restaurant Name",
      "formattedAddress": "Address",
      "location": {
        "latitude": 32.7767,
        "longitude": -96.797
      },
      "rating": 4.5,
      "userRatingCount": 100,
      "priceLevel": 2,
      "primaryType": "restaurant",
      "businessStatus": "OPERATIONAL",
      "photos": []
    }
  ]
}
```

### 2. **Geocode** (`/api/geocode`)
Converts a ZIP code to geographic coordinates using Google Geocoding API.

**Query Parameters:**
- `zipCode` (required): ZIP code to geocode

**Features:**
- Optional URL signing for additional security
- CORS enabled
- Timeout protection (10 seconds)

**Response:**
Passes through Google Geocoding API response with coordinates and formatted address.

### 3. **Diagnostic** (`/api/diagnostic`)
Health check endpoint providing system information and API connectivity status.

**Response:**
```json
{
  "message": "Diagnostic API is working",
  "timestamp": "2025-02-03T...",
  "environment": {
    "nodeVersion": "v18.x.x",
    "platform": "linux",
    "arch": "x64",
    "memory": { "total": "512 MB", "free": "256 MB" },
    "uptime": "120 minutes",
    "env": {
      "GOOGLE_API_KEY_SET": "Yes",
      "GOOGLE_SIGNING_SECRET_SET": "No"
    }
  },
  "googleApiTest": { ... },
  "urlSigningTest": { ... }
}
```

## Development

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env` file or set environment variables:
```
GOOGLE_API_KEY=your-api-key-here
GOOGLE_SIGNING_SECRET=your-signing-secret-base64  # Optional
```

### Running Tests
```bash
npm test                # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:debug     # Debug tests in Node inspector
```

### Code Quality
```bash
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
```

## Best Practices Implemented

### Error Handling
- Comprehensive input validation
- Graceful error messages without exposing sensitive data
- Proper HTTP status codes
- Detailed logging for debugging

### Security
- Input sanitization and validation
- Environment variable validation
- No sensitive data in error responses
- CORS headers configuration
- Optional URL signing for API requests

### Code Quality
- JSDoc documentation for all functions
- Utility functions extracted for testability
- Consistent code style with ESLint and Prettier
- Comprehensive test coverage (>60%)

### Performance
- Request timeouts to prevent hanging
- Efficient parameter validation
- Minimal response payloads
- Radius constraints to prevent excessive results

### Logging
- Structured logging at appropriate levels
- Request tracking
- Error diagnostics without data leaks
- API response monitoring

## Testing

The API includes comprehensive test suites:

- **Places Tests**: Coordinate validation, API response mapping, error handling
- **Geocode Tests**: ZIP code validation, URL signing, timeout handling
- **Diagnostic Tests**: Configuration verification, API connectivity tests, response structure

Coverage threshold: 60% branches, functions, lines, and statements.

## Dependencies

- `@googlemaps/google-maps-services-js@^3.6.0`: Google Maps API client
- `axios@^1.6.2`: HTTP client with timeout support

### Dev Dependencies
- `jest@^29.7.0`: Testing framework
- `eslint@^8.56.0`: Code linting
- `prettier@^3.1.0`: Code formatting

## Deployment

### Azure Functions
The API is designed for Azure Functions with Node.js 18+ runtime.

**Configuration files:**
- `host.json`: Runtime and logging configuration
- `function.json`: HTTP trigger binding for each function

### Environment Setup
Ensure these environment variables are set in Azure:
- `GOOGLE_API_KEY`: Required for all API functions
- `GOOGLE_SIGNING_SECRET`: Optional, for URL signing
- `NODE_ENV`: Set to `production` in production deployments

## Monitoring

Use the `/api/diagnostic` endpoint to:
- Verify environment configuration
- Test Google API connectivity
- Check system resources
- Validate URL signing setup

## Future Improvements

- [ ] Add caching for geocoding results
- [ ] Implement rate limiting
- [ ] Add API key rotation support
- [ ] Enhanced error telemetry
- [ ] Request tracing with Application Insights
- [ ] More granular CORS configuration
