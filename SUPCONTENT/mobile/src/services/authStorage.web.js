const TOKEN_KEY = 'supcontent.token';
const USER_KEY = 'supcontent.user';

export async function saveAuthSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export async function getAuthUser() {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

export async function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
