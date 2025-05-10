import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowDown, RefreshCw, Map, Lock, Unlock } from 'lucide-react';

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
  const canvasRef = useRef(null);
  
  // Colors for the wheel segments - memoized to prevent unnecessary re-renders
  const colors = useMemo(() => [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
    '#9966FF', '#FF9F40', '#8AC926', '#1982C4',
    '#6A4C93', '#F72585', '#7209B7', '#3A0CA3'
  ], []);
  
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
  
  // Using Google Places API V2 to fetch restaurants
  useEffect(() => {
    if (userLocation && restaurants.length === 0 && !isLocationLocked) {
      setStatus('Finding nearby restaurants...');
      
      const fetchRestaurants = async () => {
        try {
          // Make a request to our Azure Function API proxy
          const response = await fetch(`/api/places?lat=${userLocation.lat}&lng=${userLocation.lng}`);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch restaurants');
          }
          
          const data = await response.json();
          
          // Process the Places API V2 response
          if (!data.places || !Array.isArray(data.places) || data.places.length === 0) {
            setStatus('No restaurants found in this area. Try a different location.');
            return;
          }
          
          // Format the response to our app's structure
          const formattedRestaurants = data.places.map(place => {
            // Convert price level from string to number for display
            const priceMap = {
              'PRICE_LEVEL_FREE': 0,
              'PRICE_LEVEL_INEXPENSIVE': 1,
              'PRICE_LEVEL_MODERATE': 2,
              'PRICE_LEVEL_EXPENSIVE': 3,
              'PRICE_LEVEL_VERY_EXPENSIVE': 4
            };
            
            return {
              id: place.id || `place-${Math.random().toString(36).substring(2, 9)}`,
              name: place.displayName?.text || 'Unnamed Restaurant',
              rating: place.rating?.value || 0,
              price_level: place.priceLevel ? (priceMap[place.priceLevel] || 1) : 1,
              address: place.formattedAddress || '',
              photo_reference: place.photos?.[0]?.name || null,
              review_count: place.userRatingCount || 0,
              category: place.primaryTypeDisplayName?.text || 'Restaurant',
              description: place.editorialSummary?.text || '',
              business_status: place.businessStatus || 'OPERATIONAL'
            };
          });
          
          setRestaurants(formattedRestaurants);
          setStatus(`Found ${formattedRestaurants.length} restaurants${isUsingZipCode ? ` for ZIP ${zipCode}` : ''}! Spin the wheel to choose.`);
        } catch (error) {
          console.error('Error fetching restaurants:', error);
          setStatus(`Error loading restaurants: ${error.message}. Please try again.`);
        }
      };
      
      fetchRestaurants();
    }
  }, [userLocation, restaurants.length, isLocationLocked, isUsingZipCode, zipCode]);
  
  // Function to draw the wheel - defined with useRef to avoid dependency issues
  const drawWheelRef = useRef((restaurantsData = restaurants) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw wheel segments
    const totalSlices = restaurantsData.length;
    if (totalSlices === 0) return;
    
    const anglePerSlice = (2 * Math.PI) / totalSlices;
    
    restaurantsData.forEach((restaurant, index) => {
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
  });
  
  // Update drawWheelRef.current when restaurants or colors change
  useEffect(() => {
    drawWheelRef.current = (restaurantsData = restaurants) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 10;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw wheel segments
      const totalSlices = restaurantsData.length;
      if (totalSlices === 0) return;
      
      const anglePerSlice = (2 * Math.PI) / totalSlices;
      
      restaurantsData.forEach((restaurant, index) => {
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
  
  // Function to handle zip code submission
  function handleZipCodeSubmit(e) {
    e.preventDefault();
    
    if (!zipCode.trim() || !/^\d{5}(-\d{4})?$/.test(zipCode)) {
      setStatus('Please enter a valid US zip code.');
      return;
    }
    
    setStatus('Finding location for zip code...');
    
    // Call the geocoding API to convert zip to coordinates
    const geocodeZipCode = async () => {
      try {
        const response = await fetch(`/api/geocode?zipCode=${zipCode}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to geocode ZIP code');
        }
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          setUserLocation({
            lat: location.lat,
            lng: location.lng
          });
          setIsUsingZipCode(true);
          setLocationError(null);
          setStatus(`Using location for ${data.results[0].formatted_address}`);
          
          // Clear restaurants so they'll be refetched
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
  }
  
  // Function to spin the wheel
  function spinWheel() {
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
      if (!canvas) {
        setIsSpinning(false);
        return;
      }
      
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
      
      // Draw wheel without the pointer during animation
      drawWheelRef.current(restaurants);
      
      ctx.restore();
      
      // Draw pointer (not rotating)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 30);
      ctx.lineTo(centerX - 10, centerY - 60);
      ctx.lineTo(centerX + 10, centerY - 60);
      ctx.closePath();
      ctx.fillStyle = '#FF4136';
      ctx.fill();
      
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
  }
  
  // Function to refresh restaurant list
  function refreshRestaurants() {
    setRestaurants([]);
    setSelectedRestaurant(null);
    setStatus('Refreshing restaurant list...');
    
    // If location is locked, unlock it to get new location
    if (isLocationLocked) {
      setIsLocationLocked(false);
      setUserLocation(null);
    }
  }
  
  // Function to toggle location lock
  function toggleLocationLock() {
    setIsLocationLocked(!isLocationLocked);
    setStatus(isLocationLocked ? 'Location unlocked. Refreshing data...' : 'Location locked to current position');
    
    if (isLocationLocked) {
      setRestaurants([]);
      setSelectedRestaurant(null);
    }
  }

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
            type="button"
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
          className={`px-6 py-3 rounded-lg text-white font-bold ${
            isSpinning || restaurants.length === 0 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
        </button>
        
        <button 
          onClick={refreshRestaurants}
          disabled={isSpinning}
          className={`px-6 py-3 rounded-lg text-white font-bold flex items-center ${
            isSpinning ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
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
              {selectedRestaurant.place_id && (
                <a 
                  href={`https://www.google.com/maps/place/?q=place_id:${selectedRestaurant.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center transition-colors"
                >
                  <Map size={16} className="mr-2" />
                  View on Map
                </a>
              )}
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
    </div>
  );
};

export default WheelOfLunch;