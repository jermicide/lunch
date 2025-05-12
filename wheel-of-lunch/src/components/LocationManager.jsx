// components/LocationManager.jsx
import React, { useEffect } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { geocodeZipCode } from '../services/geocodeService';

const LocationManager = ({
  userLocation,
  setUserLocation,
  isLocationLocked,
  toggleLocationLock,
  locationError,
  setLocationError,
  zipCode,
  setZipCode,
  isUsingZipCode,
  setIsUsingZipCode,
  status,
  setStatus,
  setRestaurants,
  setSelectedRestaurant
}) => {
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
  }, [userLocation, isLocationLocked, isUsingZipCode, locationError, setStatus, setLocationError, setUserLocation]);

  // Function to toggle to ZIP code mode
  function toggleToZipCodeMode() {
    console.log('Switching to ZIP code mode');
    setRestaurants([]);
    setSelectedRestaurant(null);
    setLocationError("Enter a ZIP code to search a different area.");
    setUserLocation(null);
    setStatus('Please enter a ZIP code to find restaurants');
  }
  
  // Function to handle zip code submission
  function handleZipCodeSubmit(e) {
    e.preventDefault();
    
    if (!zipCode.trim() || !/^\d{5}(-\d{4})?$/.test(zipCode)) {
      setStatus('Please enter a valid US zip code.');
      return;
    }
    
    setStatus('Finding location for zip code...');
    
    const processZipCode = async () => {
      try {
        const locationResult = await geocodeZipCode(zipCode);
        
        if (locationResult.success) {
          setUserLocation(locationResult.location);
          setIsUsingZipCode(true);
          setLocationError(null);
          setStatus(`Using location for ${locationResult.address}`);
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
    
    processZipCode();
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

  return (
    <div className="bg-gray-100 w-full p-4 rounded-lg mb-6">
      <p className="text-lg font-semibold">{status}</p>
      
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
                type="button"
              >
                Use Browser Location
              </button>
            )}
            <button 
              onClick={toggleLocationLock} 
              className="p-1 rounded bg-gray-200 hover:bg-gray-300"
              title={isLocationLocked ? "Unlock location" : "Lock location"}
              type="button"
            >
              {isLocationLocked ? <Lock size={16} /> : <Unlock size={16} />}
            </button>
          </div>
        </div>
      )}
      
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
          className="mt-2 text-sm text-blue-600 hover:underline focus:underline focus:outline-none"
          type="button"
        >
          Use ZIP code instead
        </button>
      )}
    </div>
  );
};

export default LocationManager;