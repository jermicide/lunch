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

## 🚀 Getting Started

### Prerequisites
- Node.js and npm installed
- Google API credentials with Places API and Geocoding API enabled
- Azure Static Web App for deployment (optional)

### Installation

1. Clone the repository
```bash
git clone https://github.com/jermicide/lunch.git
cd lunch/wheel-of-lunch
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
# Create a .env file with your Google API credentials
GOOGLE_API_KEY=your_google_api_key_here
```

### Development

Run the development server:
```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Build

Create a production build:
```bash
npm run build
```

### Testing

Run tests:
```bash
npm test
```

## 🏗️ Architecture

- **Frontend**: React + Vite with Tailwind CSS
- **Backend**: Azure Functions for API endpoints
  - `/api/places` - Google Places search
  - `/api/geocode` - ZIP code to coordinates conversion
  - `/api/diagnostic` - Configuration verification

## 🎮 How It Works

1. Allow geolocation or enter a ZIP code
2. Select search preferences (radius or distance)
3. Spin the wheel to randomly select a restaurant
4. View details and get directions to your chosen restaurant

## 📝 License

MIT License - See LICENSE file for details
