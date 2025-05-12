// components/SearchControls.jsx
import React from 'react';

const SearchControls = ({
  rankBy,
  setRankBy,
  searchRadius,
  setSearchRadius,
  setRestaurants,
  setSelectedRestaurant,
  userLocation
}) => {
  // Convert meters to miles for display
  const radiusInMiles = (searchRadius / 1609.34).toFixed(1);
  
  // Function to handle radius change
  function handleRadiusChange(e) {
    const newRadius = Number(e.target.value);
    setSearchRadius(newRadius);
    if (userLocation) {
      setRestaurants([]);
      setSelectedRestaurant(null);
    }
  }
  
  // Function to handle rankBy change
  function handleRankByChange(e) {
    const newRankBy = e.target.value;
    setRankBy(newRankBy);
    if (userLocation) {
      setRestaurants([]);
      setSelectedRestaurant(null);
    }
  }

  return (
    <>
      <div className="mt-4 mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sort By:
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="radius"
              checked={rankBy === 'radius'}
              onChange={handleRankByChange}
              className="mr-2"
            />
            Radius ({radiusInMiles} miles)
          </label>
          <label className="flex items-center">
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
          <label htmlFor="radius-slider" className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
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
    </>
  );
};

export default SearchControls;