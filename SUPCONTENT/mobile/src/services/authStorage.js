import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'supcontent.token';
const USER_KEY = 'supcontent.user';

export async function saveAuthSession(token, user) {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
}

export async function getAuthToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getAuthUser() {
  const user = await AsyncStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

export async function clearAuthSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
