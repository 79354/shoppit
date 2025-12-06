import axios from "axios";

// export const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const baseURL = "http://127.0.0.1:8008";

export const api = axios.create({
  baseURL: baseURL
});

// Request interceptor → attach access token
api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("access_token");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor → handle 401 (expired access token)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loop
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const res = await axios.post(`${baseURL}/token_refresh/`, {
            refresh: refreshToken,
          });

          const newAccess = res.data.access;
          localStorage.setItem("access_token", newAccess);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error("Refresh token expired. Logging out...", refreshError);
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/signin"; // redirect to login
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
