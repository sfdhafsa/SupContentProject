import { Platform } from 'react-native';

const getDefaultHost = () => {
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';  // émulateur Android
  if (Platform.OS === 'ios') return 'http://localhost:3000';      // simulateur iOS seulement
  return 'http://localhost:3000';                                  // web
};

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `${getDefaultHost()}/api`;