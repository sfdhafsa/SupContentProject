import { Platform } from 'react-native';

const defaultHost = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `${defaultHost}/api`;
