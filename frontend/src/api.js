import axios from "axios";
import { auth } from "./firebase";

// Create custom Axios client pointing to FastAPI backend URL
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8000",
});

// Interceptor to attach Firebase ID Token to every outgoing request
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken(true); // force refresh to avoid expired tokens
        config.headers.Authorization = `Bearer ${token}`;
      } catch (e) {
        console.error("Error retrieving ID token:", e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
