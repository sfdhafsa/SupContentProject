import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { getGoogleOAuthUrl } from './authApi';

export function getOAuthRedirectUri() {
  if (Platform.OS === 'web') {
    return `${window.location.origin}/auth/callback`;
  }

  return Linking.createURL('auth/callback', { scheme: 'supcontent' });
}

export async function startGoogleOAuth() {
  const authUrl = getGoogleOAuthUrl(getOAuthRedirectUri());

  if (Platform.OS === 'web') {
    window.location.href = authUrl;
    return;
  }

  await Linking.openURL(authUrl);
}
