import { useState, useEffect } from "react";

/**
 * Custom hook to calculate dimensions based on container and fullscreen state
 * @param {React.RefObject} ref - Reference to the container element
 * @param {boolean} isFullscreen - Whether the component is in fullscreen mode
 * @returns {Object} - Width and height dimensions
 */
export const useDimensions = (ref, isFullscreen) => {
  const [dimensions, setDimensions] = useState({
    width: 900,
    height: 500
  });
  
  useEffect(() => {
    const updateDimensions = () => {
      if (isFullscreen && ref.current) {
        // Get the container size for fullscreen mode
        const containerWidth = ref.current.clientWidth;
        const containerHeight = ref.current.clientHeight;
        
        // Set dimensions to fill the container with some padding
        setDimensions({
          width: containerWidth - 60, // Account for container padding
          height: containerHeight - 180 // Account for header and controls
        });
      } else {
        // Default dimensions for non-fullscreen mode
        setDimensions({
          width: 900,
          height: 500
        });
      }
    };
    
    // Update dimensions on fullscreen change
    updateDimensions();
    
    // Add resize listener for responsive fullscreen
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [isFullscreen, ref]);
  
  return dimensions;
}; 