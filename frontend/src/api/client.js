import axios from "axios";

// ================= BASE URL =================
const API_URL = import.meta.env.VITE_API_URL;

// ================= AXIOS INSTANCE =================
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ================= REQUEST INTERCEPTOR =================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ================= RESPONSE INTERCEPTOR =================
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Avoid crash if no response (network error)
    if (!error.response) {
      return Promise.reject(error);
    }

    // Handle 401 (token expired)
    if (
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refresh_token = localStorage.getItem("refresh_token");

      if (!refresh_token) {
        localStorage.clear();
        window.location.href = "/";
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          `${API_URL}/auth/refresh`,
          { refresh_token }
        );

        const newAccess = res.data.access_token;

        // Save new token
        localStorage.setItem("token", newAccess);

        // Update headers
        api.defaults.headers.common["Authorization"] = `Bearer ${newAccess}`;
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        // Retry original request
        return api(originalRequest);

      } catch (refreshErr) {
        localStorage.clear();
        window.location.href = "/";
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

// ================= EXPLAIN =================
export const explainRungs = (data) =>
  api.post("/explain-rungs", data);

// ================= AUTH =================
export const login = (data) =>
  api.post("/auth/login", data);

export const signup = (data) =>
  api.post("/auth/signup", data);

export const googleLogin = (token) =>
  api.post("/auth/google", { token });

export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email });

export const verifyOTP = (email, otp) =>
  api.post("/auth/verify-otp", { email, otp });

export const resetPassword = (email, otp, new_password) =>
  api.post("/auth/reset-password", {
    email,
    otp,
    new_password,
  });

export const refreshToken = (refresh_token) =>
  api.post("/auth/refresh", { refresh_token });

// ================= CORE =================
export const generate = (data) =>
  api.post("/generate", data);

export const getProjects = (uid) =>
  api.get(`/projects/${uid}`);

export const updateRung = (data) =>
  api.patch("/update-rung", data);

// ================= ADMIN =================
export const getUsers = () =>
  api.get("/admin/users");

export const deleteUser = (uid) =>
  api.delete(`/admin/users/${uid}`);

// ================= EXPORT =================
export default api;