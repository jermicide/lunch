# API Update Changelog

## Overview
Comprehensive update to the Wheel of Lunch API with latest dependency versions, improved code quality, and comprehensive test coverage.

## Latest Changes (February 3, 2026)

### ✅ Restaurant-Only Filtering
**Files:** [places/index.js](places/index.js), [places/index.test.js](places/index.test.js)

**New Feature:** Automatic filtering to ensure only actual restaurants are returned.

**Excluded Place Types:**
- gas_station
- convenience_store
- department_store
- supermarket
- shopping_mall
- grocery_or_supermarket
- car_rental, car_repair, car_wash
- parking
- automotive_repair_shop
- hardware_store
- home_improvement_store
- furniture_store
- clothing_store
- pharmacy
- health_and_beauty

**Implementation:**
- Added `EXCLUDED_TYPES` Set for efficient type checking
- Added `isValidRestaurant()` function to validate places
- Places must have 'restaurant' type AND not have any excluded types
- Filtering applied before returning results to client
- Logs show filtered count vs total results found

**Example:**
```
Input: Search near Dallas for restaurants
API finds: 50 places (mix of restaurants, convenience stores, gas stations)
Filtered: 40 restaurants returned
Logged: "Filtered results: 40 restaurants from 50 total places"
```

**Tests Added:**
- ✓ Filter out gas stations
- ✓ Filter out convenience stores
- ✓ Filter out big box stores (Walmart, Target, etc.)
- ✓ Keep restaurants with secondary types
- ✓ Exclude mixed-type places (e.g., gas station with cafe)

---

### 1. Dependencies Updated
**File:** [package.json](package.json)

#### Production Dependencies
- `@googlemaps/google-maps-services-js`: `^3.4.1` → `^3.6.0`
- `axios`: `^1.4.0` → `^1.6.2`
- Removed: `node-fetch@^2.6.7` (unused)

#### Development Dependencies (Added)
- `jest@^29.7.0` - Testing framework
- `eslint@^8.56.0` - Code linting
- `eslint-config-prettier@^9.1.0` - Prettier integration
- `prettier@^3.1.0` - Code formatting
- `jest-mock-extended@^3.0.5` - Mocking utilities

#### npm Scripts (Updated)
```json
{
  "test": "jest --coverage",
  "test:watch": "jest --watch",
  "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
  "lint": "eslint .",
  "format": "prettier --write ."
}
```

#### Node Engine Requirement
- Added: `"engines": { "node": ">=18.0.0" }`

---

### 2. Code Quality & Best Practices

#### Places API ([places/index.js](places/index.js))
**Improvements:**
- ✅ Extracted utility functions: `isValidCoordinates()`, `normalizeRadius()`, `mapPlaceResponse()`
- ✅ Added comprehensive JSDoc documentation
- ✅ Enhanced input validation with reusable functions
- ✅ Improved error messages (no sensitive data)
- ✅ Optional chaining for safe property access
- ✅ Consistent logging patterns

**Key Changes:**
```javascript
// Before: Inline validation
if (isNaN(latitude) || isNaN(longitude) || 
    latitude < -90 || latitude > 90 || 
    longitude < -180 || longitude > 180)

// After: Extracted function
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
```

#### Geocode API ([geocode/index.js](geocode/index.js))
**Improvements:**
- ✅ Added `isValidZipCode()` validation function
- ✅ Improved error handling with try-catch cleanup
- ✅ Added request timeout (10 seconds)
- ✅ Better logging structure
- ✅ Consistent error responses
- ✅ URL signing now properly documented

**Key Changes:**
- Timeout protection: `axios.get(requestUrl, { timeout: 10000 })`
- ZIP code validation extracted to function
- Error responses standardized

#### Diagnostic API ([diagnostic/index.js](diagnostic/index.js))
**Improvements:**
- ✅ Refactored into modular functions
- ✅ `getEnvironmentInfo()` - System information collection
- ✅ `testGoogleApi()` - Async API connectivity test
- ✅ `testUrlSigning()` - Async signing verification
- ✅ Better error handling in async operations
- ✅ Timestamp added to all test results

**New Features:**
- Graceful handling of missing API credentials
- Separate test functions for better maintainability
- Async/await instead of nested callbacks

---

### 3. New Utility Module
**File:** [utils.js](utils.js)

Shared utilities to reduce code duplication:
- `signUrl()` - URL signing with HMAC-SHA1
- `createErrorResponse()` - Standardized error responses
- `createSuccessResponse()` - Standardized success responses with CORS
- `validateEnvVars()` - Environment variable validation
- `safeLog()` - Safe logging without sensitive data
- `sanitizeObject()` - Remove sensitive keys from objects

**Benefits:**
- Centralized utility functions
- Consistent response formatting
- Secure logging practices
- Reusable across functions

---

### 4. Comprehensive Test Suite

#### Places API Tests ([places/index.test.js](places/index.test.js))
- Input validation tests (coordinates, radius)
- Configuration validation (API key check)
- Radius constraint tests (min/max limits)
- Place response mapping verification
- CORS header tests
- Error handling scenarios

**Coverage Areas:**
- Invalid coordinates handling
- Radius normalization
- Empty results handling
- API error responses

#### Geocode API Tests ([geocode/index.test.js](geocode/index.test.js))
- ZIP code validation (empty, whitespace, valid)
- API key configuration tests
- URL signing functionality
- API response handling
- Error scenarios
- Timeout handling
- Security (no sensitive data leaks)

**Coverage Areas:**
- Missing/invalid ZIP codes
- Error response handling
- URL signing when available
- Graceful failures

#### Diagnostic API Tests ([diagnostic/index.test.js](diagnostic/index.test.js))
- Basic functionality and status codes
- Environment information gathering
- Configuration detection (no data leaks)
- Google API connectivity tests
- URL signing test scenarios
- Error handling
- Response structure validation

**Coverage Areas:**
- Safe environment variable exposure
- Conditional test execution
- Skip logic for missing credentials
- Response structure validation

#### Utilities Tests ([utils.test.js](utils.test.js))
- URL signing with various inputs
- Error response creation
- Success response with CORS
- Environment variable validation
- Object sanitization (security focus)
- Safe logging practices

**Coverage Areas:**
- Sensitive key detection (case-insensitive)
- Nested object sanitization
- Array handling
- Primitive type preservation

---

### 5. Configuration Files

#### ESLint Configuration ([.eslintrc.json](.eslintrc.json))
**Rules:**
- `no-console`: Warn (but allow warn/error)
- `no-unused-vars`: Error with args ignoring underscore-prefixed
- `prefer-const`: Enforce
- `no-var`: Enforce
- `eqeqeq`: Enforce strict equality
- `curly`: Require braces for all blocks

**Extensions:**
- `eslint:recommended`
- `prettier` - For Prettier integration

#### Prettier Configuration ([.prettierrc.json](.prettierrc.json))
- 4-space indentation
- Semicolons required
- Single quotes for strings
- Trailing commas (ES5)
- 100-character print width

#### Jest Configuration ([jest.config.js](jest.config.js))
**Settings:**
- Node test environment
- Coverage thresholds: 60% (branches, functions, lines, statements)
- Coverage include: All .js files except node_modules, dist, config files
- Test timeout: 10 seconds

#### .gitignore ([.gitignore](.gitignore))
**Ignores:**
- node_modules/
- .env files
- Coverage reports
- Build artifacts
- IDE files
- OS files

---

### 6. Documentation

#### Comprehensive README ([README.md](README.md))
**Sections:**
- Architecture overview with all 3 functions
- Query parameters and response formats
- Development setup and environment variables
- Running tests and linting
- Best practices implemented
- Testing strategy and coverage
- Deployment instructions
- Monitoring and diagnostics
- Future improvements

**Code Examples:**
- Sample request/response for each endpoint
- Environment variable requirements
- Testing commands
- Configuration validation

---

## Summary of Improvements

### Code Quality
| Aspect | Before | After |
|--------|--------|-------|
| **Linting** | None | ESLint (8 rules) |
| **Code Formatting** | Manual | Prettier (automated) |
| **Utility Functions** | Duplicated | Centralized (utils.js) |
| **Documentation** | Minimal comments | Comprehensive JSDoc |
| **Error Handling** | Basic | Structured, secure |

### Testing
| Metric | Before | After |
|--------|--------|-------|
| **Test Files** | 0 | 4 (places, geocode, diagnostic, utils) |
| **Test Cases** | 0 | 80+ |
| **Coverage Target** | None | 60% minimum |
| **Test Framework** | None | Jest |

### Dependencies
| Aspect | Before | After |
|--------|--------|-------|
| **Production Deps** | 3 | 2 (removed unused) |
| **Dev Deps** | 0 | 5 |
| **Latest Versions** | Partial | Current as of 2025 |
| **Node Requirement** | Any | ≥18.0.0 |

### Best Practices Implemented
✅ Input validation with reusable functions
✅ Error handling without data leaks
✅ Comprehensive logging
✅ CORS header configuration
✅ Timeout protection on external requests
✅ Environment variable validation
✅ Sensitive data sanitization
✅ Modular, testable code
✅ Consistent code style
✅ Security-focused design

---

## How to Use These Updates

### Install Dependencies
```bash
npm install
```

### Run Tests
```bash
npm test              # Run all tests with coverage
npm run test:watch   # Watch mode for development
npm run test:debug   # Debug in Node inspector
```

### Lint Code
```bash
npm run lint         # Check for style issues
npm run format       # Auto-format code
```

### Verify Configuration
```bash
curl http://localhost:7071/api/diagnostic
```

---

## Breaking Changes
**None** - All changes are backwards compatible. Existing API contracts remain unchanged.

---

## Migration Notes
1. Update dependencies: `npm install`
2. Run tests to verify: `npm test`
3. Lint code: `npm run lint`
4. Optional: Format code: `npm run format`
5. Deploy updated code

---

## Future Recommendations
- Add request/response logging middleware
- Implement rate limiting
- Add caching for geocoding results
- Integration with Application Insights telemetry
- API versioning strategy
- Webhook support for async operations
