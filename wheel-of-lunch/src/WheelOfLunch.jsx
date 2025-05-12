// WheelOfLunch.jsx - Main container component
import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import LocationManager from './components/LocationManager';
import SearchControls from './components/SearchControls';
import SpinningWheel from './components/SpinningWheel';
import RestaurantResult from './components/RestaurantResult';
import { fetchRestaurantsData } from './services/restaurantService';
import { calculateDistance } from './utils/geoUtils';

const WheelOfLunch = () => {
  // Core state
  const [restaurants, setRestaurants] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [status, setStatus] = useState('Getting started...');
  
  // Location state
  const [userLocation, setUserLocation] = useState(null);
  const [isLocationLocked, setIsLocationLocked] = useState(false);
  const [zipCode, setZipCode] = useState('');
  const [isUsingZipCode, setIsUsingZipCode] = useState(false);
  const [locationError, setLocationError] = useState(null);
  
  // Search parameters
  const [searchRadius, setSearchRadius] = useState(10000); // Default radius in meters
  const [rankBy, setRankBy] = useState('radius'); // 'radius' or 'distance'

  // Fetch restaurants effect
  useEffect(() => {
    if (userLocation && restaurants.length === 0 && !isLocationLocked) {
      setStatus('Finding nearby restaurants...');
      
      const getRestaurants = async () => {
        try {
          const formattedRestaurants = await fetchRestaurantsData(userLocation, searchRadius, rankBy);
          
          if (formattedRestaurants.length === 0) {
            setStatus('No restaurants found in this area. Try a different location or increase your search radius.');
            return;
          }
          
          setRestaurants(formattedRestaurants);
          
          const radiusInMiles = (searchRadius / 1609.34).toFixed(1);
          setStatus(`Found ${formattedRestaurants.length} restaurants${rankBy === 'radius' ? ` within ${radiusInMiles} miles` : ''}${isUsingZipCode ? ` of ZIP ${zipCode}` : ''}! Spin the wheel to choose.`);
        } catch (error) {
          console.error('Error fetching restaurants:', error);
          setStatus(`Error loading restaurants: ${error.message}. Please try again or use a different location.`);
        }
      };
      
      getRestaurants();
    }
  }, [userLocation, restaurants.length, isLocationLocked, isUsingZipCode, zipCode, searchRadius, rankBy]);

  // Function to spin the wheel
  function spinWheel() {
    if (isSpinning || restaurants.length === 0) return;
    
    setIsSpinning(true);
    setSelectedRestaurant(null);
    setStatus('Spinning the wheel...');
    
    // Select random restaurant
    const randomIndex = Math.floor(Math.random() * restaurants.length);
    
    // Simulate spinning delay
    setTimeout(() => {
      setIsSpinning(false);
      setSelectedRestaurant(restaurants[randomIndex]);
      setStatus(`Your lunch destination: ${restaurants[randomIndex].name}`);
    }, 3000);
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
    setIsLocationLocked(!isLocationLocked);
    setStatus(isLocationLocked ? 'Location unlocked. Refreshing data...' : 'Location locked to current position');
    
    if (isLocationLocked) {
      setRestaurants([]);
      setSelectedRestaurant(null);
    }
  }

  return (
    <div className="flex flex-col items-center p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">Lakey's Wheel of Lunch</h1>
      
      <LocationManager
        userLocation={userLocation}
        setUserLocation={setUserLocation}
        isLocationLocked={isLocationLocked}
        toggleLocationLock={toggleLocationLock}
        locationError={locationError}
        setLocationError={setLocationError}
        zipCode={zipCode}
        setZipCode={setZipCode}
        isUsingZipCode={isUsingZipCode}
        setIsUsingZipCode={setIsUsingZipCode}
        status={status}
        setStatus={setStatus}
        setRestaurants={setRestaurants}
        setSelectedRestaurant={setSelectedRestaurant}
      />
      
      <SearchControls
        rankBy={rankBy}
        setRankBy={setRankBy}
        searchRadius={searchRadius}
        setSearchRadius={setSearchRadius}
        setRestaurants={setRestaurants}
        setSelectedRestaurant={setSelectedRestaurant}
        userLocation={userLocation}
      />
      
      <SpinningWheel
        restaurants={restaurants}
        isSpinning={isSpinning}
        spinWheel={spinWheel}
        setIsSpinning={setIsSpinning}
        setSelectedRestaurant={setSelectedRestaurant}
        setStatus={setStatus}
      />
      
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <button 
          onClick={spinWheel}
          disabled={isSpinning || restaurants.length === 0}
          className={`px-6 py-3 rounded-lg text-white font-bold ${
            isSpinning || restaurants.length === 0 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-500 hover:bg-green-600'
          }`}
          type="button"
        >
          {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
        </button>
        
        <button 
          onClick={refreshRestaurants}
          disabled={isSpinning}
          className={`px-6 py-3 rounded-lg text-white font-bold flex items-center ${
            isSpinning ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
          }`}
          type="button"
        >
          <RefreshCw size={18} className="mr-2" />
          Refresh Options
        </button>
      </div>
      
      {selectedRestaurant && (
        <RestaurantResult
          restaurant={selectedRestaurant}
          userLocation={userLocation}
          spinWheel={spinWheel}
          isSpinning={isSpinning}
          calculateDistance={calculateDistance}
        />
      )}
    </div>
  );
};

export default WheelOfLunch;