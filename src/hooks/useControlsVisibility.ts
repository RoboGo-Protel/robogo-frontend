import { useState, useEffect } from 'react';

/**
 * Custom hook for managing monitoring controls visibility state in localStorage
 */
export function useControlsVisibility() {
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Load initial state from localStorage
    try {
      const stored = localStorage.getItem('robogo_monitoring_controls_visible');
      if (stored !== null) {
        setShowControls(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading controls visibility state:', error);
      // Default to true if there's an error
      setShowControls(true);
    }
    setIsLoaded(true);
  }, []);

  const toggleControls = (value?: boolean) => {
    const newValue = value !== undefined ? value : !showControls;
    setShowControls(newValue);

    try {
      localStorage.setItem(
        'robogo_monitoring_controls_visible',
        JSON.stringify(newValue),
      );
    } catch (error) {
      console.error('Error saving controls visibility state:', error);
    }
  };

  return {
    showControls,
    toggleControls,
    isLoaded,
  };
}
