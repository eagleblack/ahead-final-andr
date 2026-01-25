import { Platform } from 'react-native';

/**
 * Determines the appropriate status bar configuration based on theme
 * @param {Object} theme - The current theme object
 * @returns {Object} - Status bar configuration
 */
export const getStatusBarConfig = (theme) => {
  // Get the primary background color
  let backgroundColor;
  
  if (theme.background.type === 'gradient') {
    // Use the first gradient color as the status bar color
    backgroundColor = theme.background.gradient[0];
  } else if (theme.background.type === 'image') {
    // Use the fallback color for image backgrounds
    backgroundColor = theme.background.color;
  } else {
    // Use the solid color
    backgroundColor = theme.background.color;
  }

  // Determine if we should use light or dark content
  const isLightBackground = isColorLight(backgroundColor);
  
  return {
    backgroundColor,
    barStyle: isLightBackground ? 'dark-content' : 'light-content',
    translucent: false,
  };
};

/**
 * Determines if a color is light or dark
 * @param {string} color - Hex color string
 * @returns {boolean} - true if light, false if dark
 */
const isColorLight = (color) => {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5;
};

/**
 * Gets the appropriate status bar style for Android
 * @param {Object} theme - The current theme object
 * @returns {string} - Status bar style
 */
export const getAndroidStatusBarStyle = (theme) => {
  const config = getStatusBarConfig(theme);
  return config.barStyle === 'light-content' ? 'light' : 'dark';
};
