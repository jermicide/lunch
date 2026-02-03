# Copilot instructions for lunch

## Big picture
- Single-page React app (Vite) in wheel-of-lunch/ that renders the full UI from `WheelOfLunch` in [wheel-of-lunch/src/components/WheelOfLunch.jsx](wheel-of-lunch/src/components/WheelOfLunch.jsx) via [wheel-of-lunch/src/App.jsx](wheel-of-lunch/src/App.jsx) and [wheel-of-lunch/src/main.jsx](wheel-of-lunch/src/main.jsx) with the root HTML in [wheel-of-lunch/index.html](wheel-of-lunch/index.html).
- Serverless API lives in Azure Functions under [wheel-of-lunch/api](wheel-of-lunch/api) with routes configured in [wheel-of-lunch/staticwebapp.config.json](wheel-of-lunch/staticwebapp.config.json). The client calls `/api/places` and `/api/geocode` with `fetch()` from `WheelOfLunch`.

## Data flow + integrations
- UI asks for geolocation or a ZIP code; ZIPs are geocoded through [wheel-of-lunch/api/geocode/index.js](wheel-of-lunch/api/geocode/index.js) and then used to fetch places from [wheel-of-lunch/api/places/index.js](wheel-of-lunch/api/places/index.js).
- Places response is normalized in `WheelOfLunch` (mapping Google fields to `name`, `rating`, `price_level`, etc.), then drawn on a `<canvas>` wheel and used to drive the spin animation and results panel.
- External dependencies:
  - Google Places SDK via `@googlemaps/google-maps-services-js` in the API layer.
  - Google Geocoding via `axios` in the API layer.
  - Requires env vars `GOOGLE_API_KEY` and optionally `GOOGLE_SIGNING_SECRET` (diagnostics check this in [wheel-of-lunch/api/diagnostic/index.js](wheel-of-lunch/api/diagnostic/index.js)).

## Project-specific patterns
- The wheel drawing logic is canvas-based and managed through a mutable ref (`drawWheelRef`) in `WheelOfLunch`; avoid re-rendering the whole component just to redraw the wheel—update the ref and call `drawWheel()` instead.
- API endpoints return a normalized `places` array; frontend expects the shape produced by [wheel-of-lunch/api/places/index.js](wheel-of-lunch/api/places/index.js), so keep changes in sync if you modify that mapping.
- Share UI is isolated in `ShareButtons` under [wheel-of-lunch/src/components/ShareButtons](wheel-of-lunch/src/components/ShareButtons) and imported from `WheelOfLunch`.

## Developer workflows
- Run the app from wheel-of-lunch/: `npm start`, `npm test`, `npm run build` (see scripts in [wheel-of-lunch/package.json](wheel-of-lunch/package.json)).
- API functions are standard Azure Functions with HTTP triggers and `routePrefix: "api"` in [wheel-of-lunch/api/host.json](wheel-of-lunch/api/host.json). Ensure local dev or deployment provides the required Google API env vars.

## Where to look first
- Core UI and logic: [wheel-of-lunch/src/components/WheelOfLunch.jsx](wheel-of-lunch/src/components/WheelOfLunch.jsx)
- API behavior + response shapes: [wheel-of-lunch/api/places/index.js](wheel-of-lunch/api/places/index.js), [wheel-of-lunch/api/geocode/index.js](wheel-of-lunch/api/geocode/index.js)
- Routing/cors for SWA: [wheel-of-lunch/staticwebapp.config.json](wheel-of-lunch/staticwebapp.config.json)
