# 🎡 Lakey's Wheel of Lunch

A React-based restaurant picker that spins the wheel to help groups decide where to eat. Features a vibrant Price is Right-inspired spinner with integration to Google Places and Geocoding APIs.

## ✨ Features

- **Interactive Spinning Wheel**: A game-show style spinner with vibrant colors and 3D effects
- **Location-Based Restaurant Search**: Find restaurants near you using geolocation or ZIP code search
- **Customizable Search**: Filter by search radius or distance ranking
- **Restaurant Details**: View ratings, price levels, business status, and directions
- **Share Results**: Built-in sharing buttons to share your lunch pick
- **Dark Theme**: Modern dark interface with game-show aesthetics
- **Responsive Design**: Works on desktop and mobile devices
- **Ad-Free**: Clean, distraction-free experience

## 🏗️ Architecture

This project uses a decoupled architecture for optimal deployment on Azure:

- **Frontend**: React SPA deployed on Azure Static Web Apps
  - Location: `/wheel-of-lunch`
  - Built with Vite, React, and Tailwind CSS
  - Hosted on Azure Static Web Apps

- **API**: Standalone Azure Function App
  - Location: `/api`
  - Node.js Azure Functions
  - Separate deployment and scaling from frontend
  - Integrates with Google Places API

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- Google API credentials with Places API and Geocoding API enabled
- Azure CLI (for deployment)
- Azure Function Core Tools (for local API development)

### Local Development

#### 1. Clone the repository
```bash
git clone https://github.com/jermicide/lunch.git
cd lunch
```

#### 2. Set up the API

```bash
cd api
cp local.settings.json.template local.settings.json
# Edit local.settings.json and add your Google API credentials
npm install
func start  # Starts API on http://localhost:7071
```

#### 3. Set up the Frontend (in a new terminal)

```bash
cd wheel-of-lunch
npm install
npm run dev  # Starts frontend on http://localhost:5173
```

The frontend dev server is configured to proxy API requests to `http://localhost:7071`.

### Environment Variables

#### API (`/api/local.settings.json`)
```json
{
  "Values": {
    "GOOGLE_API_KEY": "your-google-api-key",
    "GOOGLE_SIGNING_SECRET": "your-signing-secret"
  }
}
```

#### Frontend (`/wheel-of-lunch/.env`)
```bash
VITE_API_BASE_URL=/api  # For local development with proxy
# OR
VITE_API_BASE_URL=https://wheel-of-lunch-api.azurewebsites.net/api  # For production
```

## 🚢 Deployment

### API Deployment

The API is deployed as a standalone Azure Function App. See [api/DEPLOYMENT.md](./api/DEPLOYMENT.md) for detailed instructions.

**Quick deploy via GitHub Actions:**
1. Create an Azure Function App
2. Configure GitHub secrets (see DEPLOYMENT.md)
3. Push to main branch - automatic deployment via `.github/workflows/azure-function-app-deploy.yml`

### Frontend Deployment

The frontend is deployed to Azure Static Web Apps automatically via GitHub Actions.

**Configuration:**
- Workflow: `.github/workflows/azure-static-web-apps-icy-mushroom-0aa01d710.yml`
- Set `VITE_API_BASE_URL` secret to your Function App URL

## 🧪 Testing

### API Tests
```bash
cd api
npm test                 # Run all tests
npm run test:watch       # Watch mode
```

### Frontend Tests
```bash
cd wheel-of-lunch
npm test
```

## 📁 Project Structure

```
lunch/
├── api/                          # Standalone Azure Function App
│   ├── places/                   # Places search endpoint
│   ├── geocode/                  # ZIP code geocoding endpoint
│   ├── diagnostic/               # Health check endpoint
│   ├── test/                     # Test endpoint
│   ├── host.json                 # Function app configuration
│   ├── package.json              # API dependencies
│   └── DEPLOYMENT.md             # API deployment guide
├── wheel-of-lunch/               # React frontend
│   ├── src/
│   │   ├── components/           # React components
│   │   │   └── WheelOfLunch.jsx  # Main wheel component
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/                   # Static assets
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── .github/workflows/
    ├── azure-function-app-deploy.yml        # API deployment
    └── azure-static-web-apps-*.yml          # Frontend deployment
```

## 🔌 API Endpoints

- `GET /api/places?lat={lat}&lng={lng}&radius={radius}` - Get nearby restaurants
- `GET /api/geocode?zipCode={zipCode}` - Convert ZIP to coordinates  
- `GET /api/diagnostic` - Health check and configuration status
- `GET /api/test` - Simple test endpoint

See [api/DEPLOYMENT.md](./api/DEPLOYMENT.md) for detailed API documentation.

## 🛠️ Technologies

### Frontend
- React 18
- Vite
- Tailwind CSS
- Lucide React (icons)
- Canvas API (for wheel rendering)

### API
- Azure Functions (Node.js)
- Google Maps Places API
- Google Maps Geocoding API
- Axios
- Jest (testing)

### Infrastructure
- Azure Static Web Apps (frontend)
- Azure Function App (API)
- GitHub Actions (CI/CD)
- Application Insights (monitoring)

## 🔒 Security Best Practices

✅ API keys stored in Azure configuration (never in code)  
✅ CORS properly configured for production domains  
✅ Input validation on all endpoints  
✅ HTTPS enforced  
✅ Separate deployment credentials for frontend and API

## 🎮 How It Works

1. Allow geolocation or enter a ZIP code
2. Select search preferences (radius or distance)
3. Spin the wheel to randomly select a restaurant
4. View details and get directions to your chosen restaurant

## 📝 License

MIT License - See LICENSE file for details
