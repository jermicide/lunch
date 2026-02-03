# Quick Start Guide - Wheel of Lunch API

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd wheel-of-lunch/api
npm install
```

### 2. Set Up Environment
Create a `.env` file in the `api` directory:
```
GOOGLE_API_KEY=your-api-key-here
GOOGLE_SIGNING_SECRET=optional-base64-encoded-secret
```

### 3. Run Tests
```bash
npm test                # Run all tests with coverage report
npm run test:watch     # Watch mode - reruns on file changes
npm run test:debug     # Debug tests in Node inspector
```

### 4. Check Code Quality
```bash
npm run lint           # Find style issues
npm run format         # Auto-fix formatting
```

### 5. Verify API Health
Local development (with Azure Functions Core Tools):
```bash
func start
curl http://localhost:7071/api/diagnostic
```

---

## 📁 API Functions

### Places API `/api/places`
Find restaurants near a location.

**Example:**
```bash
curl "http://localhost:7071/api/places?lat=32.7767&lng=-96.797&radius=1500"
```

**Parameters:**
- `lat` (required): Latitude (-90 to 90)
- `lng` (required): Longitude (-180 to 180)
- `radius` (optional): Search radius in meters (500-50000, default 1500)

---

### Geocode API `/api/geocode`
Convert ZIP code to coordinates.

**Example:**
```bash
curl "http://localhost:7071/api/geocode?zipCode=75201"
```

**Parameters:**
- `zipCode` (required): ZIP code to geocode

---

### Diagnostic API `/api/diagnostic`
Check API health and configuration.

**Example:**
```bash
curl http://localhost:7071/api/diagnostic
```

**Response includes:**
- Node.js version and system info
- API credential status (without exposing secrets)
- Google API connectivity test
- URL signing verification

---

## 📊 Test Coverage

View coverage report after running tests:
```bash
npm test
open coverage/lcov-report/index.html  # macOS
```

Current coverage targets:
- Branches: 60%
- Functions: 60%
- Lines: 60%
- Statements: 60%

---

## 🔍 Debugging

### Debug Tests in VS Code
1. Run: `npm run test:debug`
2. VS Code will connect automatically (or use Port 9229)
3. Set breakpoints in test files
4. Step through test execution

### View Detailed Logs
Update `host.json` log level:
```json
{
  "logging": {
    "logLevel": {
      "default": "Debug",
      "Function": "Debug"
    }
  }
}
```

---

## 📦 Project Structure

```
api/
├── places/                    # Restaurant search endpoint
│   ├── index.js              # Main function
│   ├── index.test.js         # Tests (80+ cases)
│   └── function.json         # Azure binding config
│
├── geocode/                   # ZIP code to coordinates
│   ├── index.js              # Main function
│   ├── index.test.js         # Tests
│   └── function.json         # Azure binding config
│
├── diagnostic/               # Health check endpoint
│   ├── index.js              # Main function
│   ├── index.test.js         # Tests
│   └── function.json         # Azure binding config
│
├── utils.js                  # Shared utilities (6 functions)
├── utils.test.js            # Utility tests
│
├── host.json                # Azure Functions runtime config
├── package.json             # Dependencies (updated)
├── jest.config.js          # Test configuration
├── .eslintrc.json          # Linting rules
├── .prettierrc.json        # Code formatting
├── .gitignore              # Git exclusions
│
├── README.md               # Complete documentation
├── CHANGELOG.md            # Detailed change log
└── QUICKSTART.md          # This file
```

---

## ✅ Checklist Before Deployment

- [ ] Run `npm install` to get latest dependencies
- [ ] Run `npm test` and verify all tests pass
- [ ] Run `npm run lint` and fix any issues
- [ ] Set `GOOGLE_API_KEY` environment variable
- [ ] Test `/api/diagnostic` endpoint
- [ ] Verify all three endpoints work locally
- [ ] Review `CHANGELOG.md` for breaking changes
- [ ] Update deployment docs if needed

---

## 🆘 Troubleshooting

### Tests Failing
1. Check `GOOGLE_API_KEY` is set in environment
2. Verify Node.js version is >= 18.0.0
3. Run `npm install` to update dependencies
4. Check `npm test` output for specific failures

### Lint Errors
```bash
npm run format    # Auto-fix most issues
npm run lint      # See remaining issues
```

### Functions Not Starting Locally
1. Install Azure Functions Core Tools: `brew tap azure/azure && brew install azure-cli`
2. Or use Docker: `docker run -p 7071:80 mcr.microsoft.com/azure-functions/node:4`
3. Ensure `host.json` has correct configuration

### API Returns 500 Error
1. Check `/api/diagnostic` for configuration issues
2. Verify `GOOGLE_API_KEY` is valid
3. Check function logs with `func log`
4. Review `CHANGELOG.md` for recent changes

---

## 📝 Useful Commands Reference

```bash
# Testing
npm test              # Run all tests with coverage
npm run test:watch   # Watch mode for development
npm run test:debug   # Debug tests (Node inspector)

# Code Quality
npm run lint         # Check code style
npm run format       # Auto-format code

# Development
func start          # Run locally with Azure Functions
func azure login    # Login to Azure

# Utilities
npm install         # Install/update dependencies
npm list            # View dependency tree
npm outdated        # Check for outdated packages
```

---

## 🔗 Additional Resources

- [README.md](README.md) - Full API documentation
- [CHANGELOG.md](CHANGELOG.md) - Detailed list of all changes
- [Google Places API Docs](https://developers.google.com/maps/documentation/places)
- [Google Geocoding API Docs](https://developers.google.com/maps/documentation/geocoding)
- [Azure Functions Documentation](https://learn.microsoft.com/en-us/azure/azure-functions/)
- [Jest Testing Docs](https://jestjs.io/docs/getting-started)

---

## 💡 Tips

1. **Use watch mode during development:**
   ```bash
   npm run test:watch
   ```

2. **Auto-format code before committing:**
   ```bash
   npm run format && npm run lint
   ```

3. **Check API health regularly:**
   ```bash
   curl http://localhost:7071/api/diagnostic | jq .
   ```

4. **Use `npm test -- --coverage` to see coverage gaps**

5. **Enable debug logging in tests with:**
   ```bash
   DEBUG=* npm test
   ```

---

**Last Updated:** February 3, 2025
**API Version:** 1.0.0
**Node Version Required:** >=18.0.0
