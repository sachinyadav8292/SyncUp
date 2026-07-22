import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL 
    ? `${import.meta.env.VITE_BASE_URL}/api` 
    : "http://localhost:3000/api",
  withCredentials: true,
});

// Automatically inject the Clerk JWT token into every outgoing API call
axiosInstance.interceptors.request.use(async (config) => {
  if (window.Clerk?.session) {
    try {
      const token = await window.Clerk.session.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error retrieving Clerk session token:", error);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});
