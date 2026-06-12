import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'supcontent.token';
const USER_KEY = 'supcontent.user';
const sessionListeners = new Set();

function notifySessionListeners(session) {
  sessionListeners.forEach((listener) => listener(session));
}

export function subscribeToAuthSession(listener) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

export async function saveAuthSession(token, user) {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
  notifySessionListeners({ token, user });
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
  notifySessionListeners({ token: null, user: null });
}
