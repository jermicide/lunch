import React, { useState, useEffect, useRef } from 'react';
import { ArrowDown, RefreshCw, Map, Lock, Unlock } from 'lucide-react';

const WheelOfLunch = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [status, setStatus] = useState('Getting started...');
  const [isLocationLocked, setIsLocationLocked] = useState(false);
  const [zipCode, setZipCode] = useState('');
  const [isUsingZipCode, setIsUsingZipCode] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const canvasRef = useRef(null);

  // Colors for the wheel segments
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
    '#9966FF', '#FF9F40', '#8AC926', '#1982C4',
    '#6A4C93', '#F72585', '#7209B7', '#3A0CA3'
  ];

  // Getting user location
  useEffect(() => {
    if (!isUsingZipCode && !userLocation && !isLocationLocked) {
      setStatus('Requesting your location...');
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            setLocationError(null);
            setStatus('Location acquired! Ready to find restaurants.');
          },
          (error) => {
            console.error('Geolocation error:', error);
            setLocationError(`${error.message}. You can use zip code instead.`);
            setStatus('Unable to get your location. Please enter a zip code.');
          }
        );
      } else {
        setLocationError('Geolocation is not supported by your browser');
        setStatus('Geolocation not supported. Please enter a zip code.');
      }
    }
  }, [userLocation, isLocationLocked, isUsingZipCode]);

  // Function to handle zip code submission
  const handleZipCodeSubmit = async (e) => {
    e.preventDefault();

    if (!zipCode.trim() || !/^\d{5}(-\d{4})?$/.test(zipCode)) {
      setStatus('Please enter a valid US zip code.');
      return;
    }

    setStatus('Finding location for zip code...');

    // In a real app, this would call a geocoding API to convert zip to lat/lng
    // Example with Google's Geocoding API (would be implemented in your backend)
    try {
      // Simulate geocoding API call
      setTimeout(() => {
        // Mock response for demonstration - in production, use actual API
        const mockGeocode = {
          results: [
            {
              geometry: {
                location: {
                  // Random location within Dallas area for demonstration
                  lat: 32.78 + (Math.random() * 0.1 - 0.05),
                  lng: -96.8 + (Math.random() * 0.1 - 0.05)
                }
              },
              formatted_address: `Dallas, TX ${zipCode}`
            }
          ]
        };

        if (mockGeocode.results && mockGeocode.results.length > 0) {
          const location = mockGeocode.results[0].geometry.location;
          setUserLocation({
            lat: location.lat,
            lng: location.lng
          });
          setIsUsingZipCode(true);
          setLocationError(null);
          setStatus(`Using location for ${mockGeocode.results[0].formatted_address}`);

          // Clear restaurants so they'll be refetched
          setRestaurants([]);
          setSelectedRestaurant(null);
        } else {
          setStatus('Could not find location for this zip code. Please try another.');
        }
      }, 1000);
    } catch (error) {
      console.error('Error geocoding zip code:', error);
      setStatus('Error finding location for zip code. Please try again.');
    }
  };

  // Function to switch back to browser geolocation
  const switchToBrowserLocation = () => {
    setIsUsingZipCode(false);
    setUserLocation(null);
    setZipCode('');
    setRestaurants([]);
    setSelectedRestaurant(null);
  };

  // Using Google Places API V2 to fetch restaurants
  // Replace the mock data in useEffect with real API call:

  useEffect(() => {
    if (userLocation && restaurants.length === 0 && !isLocationLocked) {
      setStatus('Finding nearby restaurants...');

      const fetchRestaurants = async () => {
        // Using a Proxy API route to protect your API key
        const response = await fetch(`/api/places?lat=${userLocation.lat}&lng=${userLocation.lng}`);
        const data = await response.json();

        if (data.results) {
          const placesResults = data.results.map(place => ({
            id: place.place_id,
            name: place.name,
            rating: place.rating || 0,
            price_level: place.price_level || 1,
            vicinity: place.vicinity
          }));

          setRestaurants(placesResults);
          setStatus('Restaurants loaded! Spin the wheel to choose.');
        } else {
          setStatus('Error loading restaurants. Please try again.');
        }
      };

      fetchRestaurants();
    }
  }, [userLocation, restaurants.length, isLocationLocked]);

  // Drawing the wheel
  useEffect(() => {
    if (restaurants.length > 0 && canvasRef.current) {
      drawWheel();
    }
  }, [restaurants, isSpinning, selectedRestaurant]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw wheel segments
    const totalSlices = restaurants.length;
    const anglePerSlice = (2 * Math.PI) / totalSlices;

    restaurants.forEach((restaurant, index) => {
      // Calculate start and end angles
      const startAngle = index * anglePerSlice;
      const endAngle = (index + 1) * anglePerSlice;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      // Fill segment
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();

      // Add restaurant name
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerSlice / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(restaurant.name, radius - 20, 5);
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#333';
    ctx.fill();

    // Draw pointer
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 30);
    ctx.lineTo(centerX - 10, centerY - 60);
    ctx.lineTo(centerX + 10, centerY - 60);
    ctx.closePath();
    ctx.fillStyle = '#FF4136';
    ctx.fill();
  };

  const spinWheel = () => {
    if (isSpinning || restaurants.length === 0) return;

    setIsSpinning(true);
    setSelectedRestaurant(null);
    setStatus('Spinning the wheel...');

    // Simulate spinning animation
    const spinTime = 3000; // 3 seconds
    const startTime = Date.now();

    const animateSpin = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / spinTime, 1);

      // Rotate canvas to simulate spinning
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // The rotation calculation creates a nice easing effect
      const rotation = 10 * Math.PI + (1 - Math.pow(1 - progress, 3)) * 20 * Math.PI;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);
      ctx.translate(-centerX, -centerY);

      drawWheel();

      ctx.restore();

      if (progress < 1) {
        requestAnimationFrame(animateSpin);
      } else {
        // Spinning complete
        setIsSpinning(false);

        // Select a random restaurant
        const randomIndex = Math.floor(Math.random() * restaurants.length);
        setSelectedRestaurant(restaurants[randomIndex]);
        setStatus(`Your lunch destination: ${restaurants[randomIndex].name}`);
      }
    };

    requestAnimationFrame(animateSpin);
  };

  const refreshRestaurants = () => {
    setRestaurants([]);
    setSelectedRestaurant(null);
    setStatus('Refreshing restaurant list...');

    // If location is locked, unlock it to get new location
    if (isLocationLocked) {
      setIsLocationLocked(false);
      setUserLocation(null);
    }
  };

  const toggleLocationLock = () => {
    setIsLocationLocked(!isLocationLocked);
    setStatus(isLocationLocked ? 'Location unlocked. Refreshing data...' : 'Location locked to current position');

    if (isLocationLocked) {
      setRestaurants([]);
      setSelectedRestaurant(null);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">Wheel of Lunch</h1>

      <div className="bg-gray-100 w-full p-4 rounded-lg mb-6">
        <p className="text-lg font-semibold">{status}</p>

        {/* Location display */}
        {userLocation && (
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-gray-600">
              {isUsingZipCode ? (
                <>Using zip code location</>
              ) : (
                <>Browser location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</>
              )}
            </p>
            <div className="flex gap-2">
              {isUsingZipCode && (
                <button
                  onClick={switchToBrowserLocation}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Use Browser Location
                </button>
              )}
              <button
                onClick={toggleLocationLock}
                className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                title={isLocationLocked ? "Unlock location" : "Lock location"}
              >
                {isLocationLocked ? <Lock size={16} /> : <Unlock size={16} />}
              </button>
            </div>
          </div>
        )}

        {/* Location error and zip code input */}
        {locationError && !userLocation && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800 mb-2">{locationError}</p>
            <form onSubmit={handleZipCodeSubmit} className="flex">
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Enter ZIP code"
                className="flex-1 px-3 py-2 border rounded-l text-sm"
                pattern="^\d{5}(-\d{4})?$"
                title="Enter a valid US ZIP code"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-500 text-white rounded-r text-sm hover:bg-blue-600"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* Show zip code entry option when location is available */}
        {!locationError && userLocation && !isUsingZipCode && (
          <button
            onClick={() => {
              setLocationError("Enter a ZIP code to search a different area.");
              setUserLocation(null);
            }}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Use ZIP code instead
          </button>
        )}
      </div>

      <div className="mb-6 relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="border rounded-full shadow-lg"
        />
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -mt-2">
          <ArrowDown size={40} color="#000" />
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <button
          onClick={spinWheel}
          disabled={isSpinning || restaurants.length === 0}
          className={`px-6 py-3 rounded-lg text-white font-bold ${isSpinning || restaurants.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600'
            }`}
        >
          {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
        </button>

        <button
          onClick={refreshRestaurants}
          disabled={isSpinning}
          className={`px-6 py-3 rounded-lg text-white font-bold flex items-center ${isSpinning ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
            }`}
        >
          <RefreshCw size={18} className="mr-2" />
          Refresh Options
        </button>
      </div>

      {selectedRestaurant && (
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md border-t-4 border-green-500">
          <h2 className="text-xl font-bold text-center mb-3">Your Lunch Pick:</h2>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-700 mb-2">{selectedRestaurant.name}</p>
            <div className="flex justify-center items-center mb-2">
              <span className="text-yellow-500 font-bold mr-1">{selectedRestaurant.rating}</span>
              <span className="text-yellow-500">★</span>
              <span className="text-gray-500 text-sm ml-1">({selectedRestaurant.review_count} reviews)</span>
              <span className="mx-2 text-gray-400">|</span>
              <span className="text-gray-800 font-medium">{"$".repeat(selectedRestaurant.price_level)}</span>
            </div>

            <p className="text-blue-600 font-semibold mb-1">{selectedRestaurant.category}</p>
            <p className="text-gray-600 text-sm mb-3">{selectedRestaurant.address}</p>

            {selectedRestaurant.description && (
              <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 italic mb-4">
                "{selectedRestaurant.description}"
              </div>
            )}

            <div className="flex justify-center gap-3">
              <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center transition-colors">
                <Map size={16} className="mr-2" />
                View on Map
              </button>
              <button
                onClick={spinWheel}
                disabled={isSpinning}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center transition-colors"
              >
                <RefreshCw size={16} className="mr-2" />
                New Pick
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600 max-w-md text-center">
        <p>Note: This is a demonstration. In a production app, you would use the Google Places API
          to fetch real restaurant data based on the user's location.</p>
      </div>
    </div>
  );
};

export default WheelOfLunch;