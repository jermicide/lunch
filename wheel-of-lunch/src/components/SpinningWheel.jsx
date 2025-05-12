// components/SpinningWheel.jsx
import React, { useEffect, useRef, useMemo } from 'react';
import { ArrowDown } from 'lucide-react';

const SpinningWheel = ({
  restaurants,
  isSpinning,
  spinWheel,
  setIsSpinning,
  setSelectedRestaurant,
  setStatus
}) => {
  const canvasRef = useRef(null);
  
  // Colors for the wheel segments - memoized to prevent unnecessary re-renders
  const colors = useMemo(() => [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
    '#9966FF', '#FF9F40', '#8AC926', '#1982C4',
    '#6A4C93', '#F72585', '#7209B7', '#3A0CA3'
  ], []);
  
  // Function to draw the wheel
  const drawWheelRef = useRef((restaurantsData = restaurants) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const totalSlices = restaurantsData.length;
    if (totalSlices === 0) return;
    
    const anglePerSlice = (2 * Math.PI) / totalSlices;
    
    restaurantsData.forEach((restaurant, index) => {
      const startAngle = index * anglePerSlice;
      const endAngle = (index + 1) * anglePerSlice;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerSlice / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      
      let textRadius = radius - 20;
      if (startAngle + anglePerSlice / 2 > Math.PI / 2 && startAngle + anglePerSlice / 2 < Math.PI * 3 / 2) {
        ctx.rotate(Math.PI);
        ctx.textAlign = 'left';
        textRadius = -textRadius;
      }
      
      ctx.fillText(restaurant.name, textRadius, 5);
      ctx.restore();
    });
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#333';
    ctx.fill();
    
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
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const totalSlices = restaurantsData.length;
      if (totalSlices === 0) return;
      
      const anglePerSlice = (2 * Math.PI) / totalSlices;
      
      restaurantsData.forEach((restaurant, index) => {
        const startAngle = index * anglePerSlice;
        const endAngle = (index + 1) * anglePerSlice;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        
        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + anglePerSlice / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        
        let textRadius = radius - 20;
        if (startAngle + anglePerSlice / 2 > Math.PI / 2 && startAngle + anglePerSlice / 2 < Math.PI * 3 / 2) {
          ctx.rotate(Math.PI);
          ctx.textAlign = 'left';
          textRadius = -textRadius;
        }
        
        ctx.fillText(restaurant.name, textRadius, 5);
        ctx.restore();
      });
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
      ctx.fillStyle = '#333';
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 30);
      ctx.lineTo(centerX - 10, centerY - 60);
      ctx.lineTo(centerX + 10, centerY - 60);
      ctx.closePath();
      ctx.fillStyle = '#FF4136';
      ctx.fill();
    };
  }, [restaurants, colors]);
  
  // Update wheel when restaurants change
  useEffect(() => {
    if (restaurants.length > 0 && canvasRef.current) {
      drawWheelRef.current();
    }
  }, [restaurants]);
  
  // Function to perform wheel spin animation
  const handleSpin = () => {
    // Forward the spin request to parent
    spinWheel();
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
        setSelectedRestaurant(restaurants[randomIndex]);
        setStatus(`Your lunch destination: ${restaurants[randomIndex].name}`);
      }
    };
    
    requestAnimationFrame(animateSpin);
  };

  return (
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
  );
};

export default SpinningWheel;