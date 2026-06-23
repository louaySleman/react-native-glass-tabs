import { Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

/**
 * Creates nativeIcon from Ionicons for Android Material 3 tabs.
 * Uses getImageSourceSync to generate PNG images from vector icon fonts at runtime.
 */
export const createNativeIcon = (filledName: string, outlineName: string) => {
  if (Platform.OS !== 'android') {
    return undefined;
  }
  return {
    filled: Ionicons.getImageSourceSync(filledName, 24, '#000000'),
    outline: Ionicons.getImageSourceSync(outlineName, 24, '#000000'),
  };
};
