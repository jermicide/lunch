import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RefreshCw, Map, Lock, Unlock } from 'lucide-react';
import ShareButtons from './ShareButtons';

// Get API base URL from environment variable, default to /api for backward compatibility
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const WheelOfLunch = () => {
  // State definitions
  const [restaurants, setRestaurants] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [status, setStatus] = useState('Getting started...');
  const [isLocationLocked, setIsLocationLocked] = useState(false);
  const [zipCode, setZipCode] = useState('');
  const [isUsingZipCode, setIsUsingZipCode] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [searchRadius, setSearchRadius] = useState(10000); // Default radius in meters
  const [rankBy, setRankBy] = useState('distance'); // 'radius' or 'distance'
  const canvasRef = useRef(null);

  // Colors for the wheel segments - Price is Right inspired vibrant colors - memoized to prevent unnecessary re-renders
  const colors = useMemo(() => [
    '#FF0000', '#0066FF', '#FFCC00', '#00CC00',
    '#FF6600', '#FF00FF', '#00CCFF', '#FFFF00',
    '#FF3333', '#0099FF', '#CC00FF', '#00FF99'
  ], []);

  // Function to toggle to ZIP code mode
  function toggleToZipCodeMode() {
    setRestaurants([]);
    setSelectedRestaurant(null);
    setLocationError("Enter a ZIP code to search a different area.");
    setUserLocation(null);
    setStatus('Please enter a ZIP code to find restaurants');
  }

  // Getting user location
  useEffect(() => {
    if (!isUsingZipCode && !userLocation && !isLocationLocked && !locationError) {
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
  }, [userLocation, isLocationLocked, isUsingZipCode, locationError]);

  // Using Google Places SDK to fetch restaurants
  useEffect(() => {
    if (userLocation && restaurants.length === 0 && !isLocationLocked) {
      setStatus('Finding nearby restaurants...');

      const fetchRestaurants = async () => {
        try {
          const queryParams = new URLSearchParams({
            lat: userLocation.lat,
            lng: userLocation.lng,
            ...(rankBy === 'radius' && { radius: searchRadius }),
            ...(rankBy === 'distance' && { rankBy: 'distance' })
          });

          const response = await fetch(`${API_BASE_URL}/places?${queryParams.toString()}`);

          const contentType = response.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            const responseText = await response.text();
            throw new Error(`Unexpected response from /api/places. Is the API running? ${responseText.slice(0, 120)}`);
          }

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch restaurants');
          }

          if (data.error) {
            throw new Error(data.details || data.error);
          }

          if (!data.places || !Array.isArray(data.places) || data.places.length === 0) {
            setStatus('No restaurants found in this area. Try a different location or increase your search radius.');
            return;
          }

          const formattedRestaurants = data.places.map(place => ({
            id: place.id || `place-${Math.random().toString(36).substring(2, 9)}`,
            name: place.displayName || 'Unnamed Restaurant',
            rating: place.rating || 0,
            price_level: place.priceLevel || 1,
            address: place.formattedAddress || '',
            photo_reference: place.photos?.[0]?.name || null,
            review_count: place.userRatingCount || 0,
            category: place.primaryType || 'Restaurant',
            description: '',
            business_status: place.businessStatus || 'OPERATIONAL',
            location: place.location
          }));

          setRestaurants(formattedRestaurants);

          const radiusInMiles = (searchRadius / 1609.34).toFixed(1);
          setStatus(`Found ${formattedRestaurants.length} restaurants${rankBy === 'radius' ? ` within ${radiusInMiles} miles` : ''}${isUsingZipCode ? ` of ZIP ${zipCode}` : ''}! Spin the wheel to choose.`);
        } catch (error) {
          console.error('Error fetching restaurants:', error);
          setStatus(`Error loading restaurants: ${error.message}. Please try again or use a different location.`);
        }
      };

      fetchRestaurants();
    }
  }, [userLocation, restaurants.length, isLocationLocked, isUsingZipCode, zipCode, searchRadius, rankBy]);

  // Function to handle zip code submission
  function handleZipCodeSubmit(e) {
    e.preventDefault();

    if (!zipCode.trim() || !/^\d{5}(-\d{4})?$/.test(zipCode)) {
      setStatus('Please enter a valid US zip code.');
      return;
    }

    setStatus('Finding location for zip code...');

    const geocodeZipCode = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/geocode?zipCode=${zipCode}`);

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const responseText = await response.text();
          throw new Error(`Unexpected response from /api/geocode. Is the API running? ${responseText.slice(0, 120)}`);
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to geocode ZIP code');
        }

        if (data.results && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          setUserLocation({
            lat: location.lat,
            lng: location.lng
          });
          setIsUsingZipCode(true);
          setLocationError(null);
          setStatus(`Using location for ${data.results[0].formatted_address}`);
          setRestaurants([]);
          setSelectedRestaurant(null);
        } else {
          setStatus('Could not find location for this zip code. Please try another.');
        }
      } catch (error) {
        console.error('Error geocoding zip code:', error);
        setStatus(`Error finding location for zip code: ${error.message}. Please try again.`);
      }
    };

    geocodeZipCode();
  }

  // Function to switch back to browser geolocation
  function switchToBrowserLocation() {
    setIsUsingZipCode(false);
    setUserLocation(null);
    setZipCode('');
    setRestaurants([]);
    setSelectedRestaurant(null);
    setLocationError(null);
  }

  // Function to handle radius and rankBy change
  function handleRadiusChange(e) {
    const newRadius = Number(e.target.value);
    setSearchRadius(newRadius);
    if (userLocation) {
      setRestaurants([]);
      setSelectedRestaurant(null);
    }
  }

  function handleRankByChange(e) {
    const newRankBy = e.target.value;
    setRankBy(newRankBy);
    if (userLocation) {
      setRestaurants([]);
      setSelectedRestaurant(null);
    }
  }

  // Convert meters to miles for display
  const radiusInMiles = (searchRadius / 1609.34).toFixed(1);

  // Function to draw the wheel - defined with useRef to avoid dependency issues
  const drawWheelRef = useRef((restaurantsData = restaurants) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 15;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const totalSlices = restaurantsData.length;
    if (totalSlices === 0) return;

    const anglePerSlice = (2 * Math.PI) / totalSlices;

    restaurantsData.forEach((restaurant, index) => {
      const startAngle = index * anglePerSlice;
      const endAngle = (index + 1) * anglePerSlice;

      // Draw slice with 3D effect
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();

      // Add darker border for 3D effect
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Add highlight on one side for depth
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius - 3, startAngle, startAngle + anglePerSlice * 0.3);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerSlice / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#000';
      ctx.font = 'bold 16px Arial';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 3;

      let textRadius = radius - 30;
      if (startAngle + anglePerSlice / 2 > Math.PI / 2 && startAngle + anglePerSlice / 2 < Math.PI * 3 / 2) {
        ctx.rotate(Math.PI);
        ctx.textAlign = 'left';
        textRadius = -textRadius;
      }

      // Draw text with better contrast
      ctx.fillText(restaurant.name, textRadius, 5);
      ctx.restore();
    });

    // Draw center circle with gradient
    const gradient = ctx.createRadialGradient(centerX - 5, centerY - 5, 0, centerX, centerY, 25);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(1, '#FFA500');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Update drawWheelRef.current when restaurants or colors change
  useEffect(() => {
    drawWheelRef.current = (restaurantsData = restaurants) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 15;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const totalSlices = restaurantsData.length;
      if (totalSlices === 0) return;

      const anglePerSlice = (2 * Math.PI) / totalSlices;

      restaurantsData.forEach((restaurant, index) => {
        const startAngle = index * anglePerSlice;
        const endAngle = (index + 1) * anglePerSlice;

        // Draw slice with 3D effect
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();

        // Add darker border for 3D effect
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Add highlight on one side for depth
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius - 3, startAngle, startAngle + anglePerSlice * 0.3);
        ctx.closePath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + anglePerSlice / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px Arial';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 3;

        let textRadius = radius - 30;
        if (startAngle + anglePerSlice / 2 > Math.PI / 2 && startAngle + anglePerSlice / 2 < Math.PI * 3 / 2) {
          ctx.rotate(Math.PI);
          ctx.textAlign = 'left';
          textRadius = -textRadius;
        }

        // Draw text with better contrast
        ctx.fillText(restaurant.name, textRadius, 5);
        ctx.restore();
      });

      // Draw center circle with gradient
      const gradient = ctx.createRadialGradient(centerX - 5, centerY - 5, 0, centerX, centerY, 25);
      gradient.addColorStop(0, '#FFD700');
      gradient.addColorStop(1, '#FFA500');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
    };
  }, [restaurants, colors]);

  // Helper function to call the ref's current value
  function drawWheel() {
    drawWheelRef.current();
  }

  // Update wheel when restaurants change
  useEffect(() => {
    if (restaurants.length > 0 && canvasRef.current) {
      drawWheel();
    }
  }, [restaurants]);

  // Function to spin the wheel
  function spinWheel() {
    if (isSpinning || restaurants.length === 0) return;

    setIsSpinning(true);
    setSelectedRestaurant(null);
    setStatus('Spinning the wheel...');

    // Select random restaurant at the start
    const randomIndex = Math.floor(Math.random() * restaurants.length);
    const totalSlices = restaurants.length;
    const anglePerSlice = (2 * Math.PI) / totalSlices;

    // Calculate the final angle to align the selected restaurant's segment with the pointer
    const segmentMidpoint = randomIndex * anglePerSlice + anglePerSlice / 2;
    const fullRotations = Math.floor(Math.random() * 5) + 5; // 5–9 full rotations
    const finalAngle = -segmentMidpoint + fullRotations * 2 * Math.PI;

    const spinTime = 3000; // 3 seconds
    const startTime = Date.now();

    const animateSpin = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / spinTime, 1);

      const canvas = canvasRef.current;
      if (!canvas) {
        setIsSpinning(false);
        return;
      }

      const ctx = canvas.getContext('2d');
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply easing to smoothly approach finalAngle
      const rotation = (1 - Math.pow(1 - progress, 3)) * finalAngle;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);
      ctx.translate(-centerX, -centerY);

      drawWheelRef.current(restaurants);

      ctx.restore();

      if (progress < 1) {
        requestAnimationFrame(animateSpin);
      } else {
        // Spinning complete
        setIsSpinning(false);
        setSelectedRestaurant(restaurants[randomIndex]);
        setStatus(`Your lunch destination: ${restaurants[randomIndex].name}`);
        // Scroll to results card after a short delay to ensure the element is rendered
        setTimeout(() => {
        // Scroll to bottom of page
          if (document.documentElement) {
            document.documentElement.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
          }
        },250);
      }
    };

    requestAnimationFrame(animateSpin);
  }

  // Function to refresh restaurant list
  function refreshRestaurants() {
    setRestaurants([]);
    setSelectedRestaurant(null);
    setStatus('Refreshing restaurant list...');

    if (isLocationLocked) {
      setIsLocationLocked(false);
      setUserLocation(null);
    }
  }

  // Function to toggle location lock
  function toggleLocationLock() {
    setIsLocationLocked((previousValue) => {
      const nextValue = !previousValue;
      setStatus(nextValue ? 'Location locked to current position' : 'Location unlocked. Refreshing data...');

      if (previousValue) {
        setRestaurants([]);
        setSelectedRestaurant(null);
      }

      return nextValue;
    });
  }

  // Function to calculate distance between two points using Haversine formula
  function calculateDistance(point1, point2) {
    const lat1 = point1.lat || point1.latitude;
    const lng1 = point1.lng || point1.longitude;
    const lat2 = point2.lat || point2.latitude;
    const lng2 = point2.lng || point2.longitude;

    const earthRadius = 3958.8;

    const latRad1 = (lat1 * Math.PI) / 180;
    const lngRad1 = (lng1 * Math.PI) / 180;
    const latRad2 = (lat2 * Math.PI) / 180;
    const lngRad2 = (lng2 * Math.PI) / 180;

    const diffLat = latRad2 - latRad1;
    const diffLng = lngRad2 - lngRad1;

    const a =
      Math.sin(diffLat / 2) * Math.sin(diffLat / 2) +
      Math.cos(latRad1) * Math.cos(latRad2) *
      Math.sin(diffLng / 2) * Math.sin(diffLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;

    return distance;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-2 text-white">Lakey's Wheel of Lunch</h1>
      <p className="text-center mb-8 text-gray-300">Group can't decide what's for lunch? Put your lunch selection into fate's hands. Spin Lakey's Wheel of Lunch!</p>

      <div className="bg-gray-800 w-full p-4 rounded-lg mb-8 border border-gray-700">
        <p className="text-lg font-semibold text-white">{status}</p>

        {userLocation && (
          <div className="flex items-center justify-center mt-2">
            <p className="text-sm text-gray-400">
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
                  type="button"
                >
                  Use Browser Location
                </button>
              )}
              <button
                onClick={toggleLocationLock}
                className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                title={isLocationLocked ? "Unlock location" : "Lock location"}
                type="button"
              >
                {isLocationLocked ? <Lock size={16} /> : <Unlock size={16} />}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-center mt-4 mb-2">
          <div className="flex gap-4 items-center">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Sort By:
            </label>
            <label className="flex items-center text-gray-300">
              <input
                type="radio"
                value="radius"
                checked={rankBy === 'radius'}
                onChange={handleRankByChange}
                className="mr-2"
              />
              Radius ({radiusInMiles} miles)
            </label>
            <label className="flex items-center text-gray-300">
              <input
                type="radio"
                value="distance"
                checked={rankBy === 'distance'}
                onChange={handleRankByChange}
                className="mr-2"
              />
              Distance
            </label>
          </div>
        </div>

        {rankBy === 'radius' && (
          <div className="mt-2 mb-2">
            <label htmlFor="radius-slider" className="block text-sm font-medium text-gray-300 mb-1">
              Search Radius: {radiusInMiles} miles
            </label>
            <input
              type="range"
              id="radius-slider"
              min="2000"
              max="32000"
              step="500"
              value={searchRadius}
              onChange={handleRadiusChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 mi</span>
              <span>5 mi</span>
              <span>10 mi</span>
              <span>15 mi</span>
              <span>20 mi</span>
            </div>
          </div>
        )}

        {locationError && !userLocation && (
          <div className="mt-3 p-3 bg-yellow-900 border border-yellow-700 rounded">
            <p className="text-sm text-yellow-300 mb-2">{locationError}</p>
            <form onSubmit={handleZipCodeSubmit} className="flex">
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Enter ZIP code"
                className="flex-1 px-3 py-2 border border-gray-600 rounded-l text-sm bg-gray-700 text-white placeholder-gray-500"
                pattern="^\d{5}(-\d{4})?$"
                title="Enter a valid US ZIP code"
                aria-label="ZIP code"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-500 text-white rounded-r text-sm hover:bg-blue-600"
              >
                Search
              </button>
            </form>
            <div className="text-xs text-gray-500 mt-1">
              Enter a US ZIP code (e.g., 75001) to find nearby restaurants
            </div>
          </div>
        )}

        {userLocation && !isUsingZipCode && !locationError && (
          <button
            onClick={toggleToZipCodeMode}
            className="mt-2 text-sm text-blue-400 hover:underline focus:underline focus:outline-none"
            type="button"
          >
            Use ZIP code instead
          </button>
        )}
      </div>

      <div className="mb-8 relative flex flex-col items-center">
        {/* Pointer at the top */}
        <div className="relative z-10 mb-2">
          <div className="w-0 h-0 border-l-6 border-r-6 border-t-8 border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg"
               style={{borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '15px solid #FBBF24'}}></div>
        </div>
        {/* Wheel */}
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className="border-8 border-yellow-400 rounded-full shadow-2xl drop-shadow-2xl"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <button
          onClick={spinWheel}
          disabled={isSpinning || restaurants.length === 0}
          className={`px-8 py-4 rounded-lg text-white font-bold text-lg ${
            isSpinning || restaurants.length === 0
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 shadow-lg'
          }`}
          type="button"
        >
          {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
        </button>

        <button
          onClick={refreshRestaurants}
          disabled={isSpinning}
          className={`px-8 py-4 rounded-lg text-white font-bold text-lg flex items-center ${
            isSpinning ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 shadow-lg'
          }`}
          type="button"
        >
          <RefreshCw size={20} className="mr-2" />
          Refresh Options
        </button>
      </div>

      {selectedRestaurant && (
        <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md border-t-4 border-yellow-400 mb-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-center mb-4 text-yellow-400">🎉 Your Lunch Pick 🎉</h2>
          <div className="text-center">
            <p className="text-4xl font-bold text-white mb-3">{selectedRestaurant.name}</p>

            <div className="flex justify-center items-center mb-3">
              {selectedRestaurant.rating > 0 && (
                <>
                  <span className="text-yellow-400 font-bold text-lg mr-1">{selectedRestaurant.rating.toFixed(1)}</span>
                  <span className="text-yellow-400 text-lg">★</span>
                  <span className="text-gray-400 text-sm ml-1">({selectedRestaurant.review_count} reviews)</span>
                  <span className="mx-2 text-gray-600">|</span>
                </>
              )}
              <span className="text-yellow-400 font-bold">{selectedRestaurant.price_level > 0 ? "$".repeat(selectedRestaurant.price_level) : "Price N/A"}</span>
            </div>

            {selectedRestaurant.category && (
              <p className="text-blue-400 font-semibold mb-1">{selectedRestaurant.category}</p>
            )}
            <p className="text-gray-400 text-sm mb-4">{selectedRestaurant.address}</p>

            {selectedRestaurant.business_status && (
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                selectedRestaurant.business_status === 'OPERATIONAL' ? 'bg-green-900 text-green-300' :
                selectedRestaurant.business_status === 'CLOSED_TEMPORARILY' ? 'bg-yellow-900 text-yellow-300' :
                'bg-red-900 text-red-300'
              }`}>
                {selectedRestaurant.business_status === 'OPERATIONAL' ? '✓ Open' :
                 selectedRestaurant.business_status === 'CLOSED_TEMPORARILY' ? '⏸ Temporarily Closed' :
                 '✕ Permanently Closed'}
              </div>
            )}

            {selectedRestaurant.description && (
              <div className="bg-gray-700 p-4 rounded text-sm text-gray-300 italic mb-4">
                "{selectedRestaurant.description}"
              </div>
            )}

            <div className="flex justify-center gap-3 flex-wrap">
              {selectedRestaurant.id && (
                <a
                  href={`https://www.google.com/maps/place/?q=place_id:${selectedRestaurant.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center transition-colors"
                >
                  <Map size={16} className="mr-2" />
                  View on Map
                </a>
              )}
              <button
                onClick={spinWheel}
                disabled={isSpinning}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center transition-colors"
                type="button"
              >
                <RefreshCw size={16} className="mr-2" />
                New Pick
              </button>
            </div>
            <ShareButtons 
              restaurantName={selectedRestaurant.name} 
              restaurantAddress={selectedRestaurant.address} 
            />

            {selectedRestaurant.location && userLocation && (
              <div className="mt-4 text-xs text-gray-500">
                Approximately {calculateDistance(userLocation, selectedRestaurant.location).toFixed(1)} miles away
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WheelOfLunch;
