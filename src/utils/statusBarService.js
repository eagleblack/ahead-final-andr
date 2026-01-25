import { NativeModules, Platform } from 'react-native';

const { StatusBarModule } = NativeModules;

/**
 * Sets the Android status bar color dynamically
 * @param {string} color - Hex color string (with or without #)
 * @param {boolean} isLightContent - Whether to use light content (for dark backgrounds)
 * @returns {Promise<boolean>}
 */
export const setAndroidStatusBarColor = async (color, isLightContent = false) => {

  
  if (Platform.OS !== 'android' || !StatusBarModule) {
   
    return false;
  }
  
  try {
    const result = await StatusBarModule.setStatusBarColor(color, isLightContent);
  
    return result;
  } catch (error) {
  
    return false;
  }
};

export default {
  setAndroidStatusBarColor,
};
