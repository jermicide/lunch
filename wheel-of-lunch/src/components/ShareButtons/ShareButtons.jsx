import React, { useState } from 'react';
import './ShareButtons.css';

const ShareButtons = ({ restaurantName, restaurantAddress }) => {
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  
  // Get the base content for sharing
  const getShareContent = () => {
    return {
      title: `I'm having lunch at ${restaurantName} - Wheel of Lunch`,
      text: `The Wheel of Lunch picked ${restaurantName} for me! Spin the wheel to find your next meal!`,
      url: window.location.href
    };
  };
  
  // Facebook sharing
  const shareOnFacebook = () => {
    const content = getShareContent();
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(content.url)}&quote=${encodeURIComponent(content.text)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };
  
  // Twitter/X sharing
  const shareOnTwitter = () => {
    const content = getShareContent();
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content.text)}&url=${encodeURIComponent(content.url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };
  
  // WhatsApp sharing
  const shareOnWhatsApp = () => {
    const content = getShareContent();
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(content.text + ' ' + content.url)}`;
    window.open(shareUrl, '_blank');
  };
  
  // Email sharing
  const shareViaEmail = () => {
    const content = getShareContent();
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(content.title)}&body=${encodeURIComponent(content.text + '\n\n' + content.url)}`;
    window.location.href = mailtoUrl;
  };
  
  // Copy link to clipboard
  const copyLinkToClipboard = () => {
    const content = getShareContent();
    
    // Use modern clipboard API if available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content.url)
        .then(() => {
          setShowCopySuccess(true);
          setTimeout(() => setShowCopySuccess(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
        });
    } else {
      // Fallback for older browsers
      const tempInput = document.createElement('input');
      tempInput.value = content.url;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    }
  };
  
  return (
    <div className="sharing-container">
      <h3>Share Your Lunch Pick</h3>
      <p>Found a great lunch spot? Share it with friends!</p>
      
      <div className="social-buttons">
        {/* Facebook Share Button */}
        <button 
          className="social-button facebook" 
          onClick={shareOnFacebook}
          aria-label="Share on Facebook"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M12 2.04C6.5 2.04 2.04 6.5 2.04 12C2.04 17.5 6.5 21.96 12 21.96C17.5 21.96 21.96 17.5 21.96 12C21.96 6.5 17.5 2.04 12 2.04ZM13.86 8.44H12.66C12.22 8.44 11.98 8.64 11.98 9.28V10.2H13.86L13.64 12.1H11.98V17.58H9.72V12.1H8.2V10.2H9.72V9.08C9.72 7.64 10.42 6.76 12.02 6.76H13.86V8.44Z"/>
          </svg>
        </button>
        
        {/* Twitter/X Share Button */}
        <button 
          className="social-button twitter" 
          onClick={shareOnTwitter}
          aria-label="Share on Twitter"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#1DA1F2">
            <path d="M22.46 5.71C21.69 6.05 20.86 6.26 20 6.35C20.88 5.8 21.56 4.94 21.88 3.92C21.05 4.42 20.13 4.77 19.16 4.98C18.37 4.13 17.26 3.62 16 3.62C13.65 3.62 11.73 5.51 11.73 7.86C11.73 8.19 11.77 8.51 11.84 8.82C8.28 8.64 5.11 6.96 2.96 4.39C2.63 5.01 2.44 5.7 2.44 6.43C2.44 7.82 3.15 9.06 4.2 9.75C3.5 9.74 2.79 9.53 2.17 9.18V9.23C2.17 11.29 3.62 13.01 5.55 13.4C5.23 13.49 4.89 13.53 4.54 13.53C4.29 13.53 4.06 13.5 3.83 13.46C4.3 15.14 5.9 16.36 7.79 16.4C6.3 17.5 4.47 18.16 2.47 18.16C2.15 18.16 1.84 18.14 1.53 18.1C3.44 19.27 5.7 19.97 8.12 19.97C16 19.97 20.33 13.6 20.33 8.09C20.33 7.9 20.33 7.72 20.32 7.54C21.16 6.91 21.88 6.12 22.46 5.23V5.71Z"/>
          </svg>
        </button>
        
        {/* WhatsApp Share Button */}
        <button 
          className="social-button whatsapp" 
          onClick={shareOnWhatsApp}
          aria-label="Share on WhatsApp"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#25D366">
            <path d="M12 2.04C6.5 2.04 2.04 6.5 2.04 12C2.04 13.79 2.46 15.5 3.23 17.01L2 21.96L7.08 20.77C8.53 21.47 10.21 21.84 11.96 21.84C17.5 21.84 21.96 17.41 21.96 11.91C21.96 9.23 20.92 6.69 19.03 4.8C17.13 2.91 14.66 2.04 12 2.04ZM16.87 15.5C16.58 16.23 15.46 16.84 14.64 17.02C14.06 17.14 13.29 17.23 10.88 16.2C7.85 14.92 5.93 11.84 5.77 11.62C5.62 11.4 4.54 9.97 4.54 8.5C4.54 7.03 5.29 6.3 5.64 5.93C5.93 5.62 6.37 5.5 6.78 5.5C6.91 5.5 7.04 5.51 7.15 5.51C7.5 5.53 7.68 5.55 7.91 6.05C8.19 6.68 8.82 8.15 8.88 8.28C8.95 8.4 9.02 8.57 8.92 8.74C8.83 8.91 8.74 9.01 8.62 9.16C8.5 9.31 8.39 9.44 8.27 9.59C8.15 9.72 8.03 9.86 8.17 10.12C8.32 10.38 8.83 11.25 9.61 11.94C10.61 12.82 11.45 13.11 11.76 13.23C11.98 13.32 12.25 13.3 12.4 13.13C12.59 12.92 12.83 12.53 13.07 12.15C13.24 11.87 13.47 11.83 13.71 11.92C13.95 12 15.42 12.72 15.68 12.84C15.94 12.97 16.1 13.03 16.17 13.14C16.24 13.26 16.24 13.87 15.95 15.5H16.87Z"/>
          </svg>
        </button>
        
        {/* Email Share Button */}
        <button 
          className="social-button email" 
          onClick={shareViaEmail}
          aria-label="Share via Email"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#EA4335">
            <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"/>
          </svg>
        </button>
        
        {/* Copy Link Button */}
        <button 
          className="social-button copy-link" 
          onClick={copyLinkToClipboard}
          aria-label="Copy link to clipboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#6c757d">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
          </svg>
        </button>
      </div>
      
      {/* Success message for copy link */}
      {showCopySuccess && (
        <span className="copy-success">Link copied!</span>
      )}
    </div>
  );
};

export default ShareButtons;