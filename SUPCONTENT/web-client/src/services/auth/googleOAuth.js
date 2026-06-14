const getApiBasePath = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  return apiUrl.endsWith("/api") ? apiUrl : `${apiUrl.replace(/\/$/, "")}/api`;
};

export const getGoogleAuthUrl = () => {
  const params = new URLSearchParams({
    client: "web",
    redirect_uri: `${window.location.origin}/auth/callback`,
  });

  return `${getApiBasePath()}/auth/google?${params.toString()}`;
};
