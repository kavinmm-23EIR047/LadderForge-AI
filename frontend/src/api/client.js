import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

export const explainRungs = (data) =>
  api.post("/explain-rungs", data);

// ================= REQUEST INTERCEPTOR =================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


// ================= RESPONSE INTERCEPTOR =================
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
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
          "http://127.0.0.1:8000/auth/refresh",
          {
            refresh_token,
          }
        );

        const newAccess = res.data.access_token;

        localStorage.setItem("token", newAccess);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

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


// ================= AUTH =================
export const login = (data) =>
  api.post("/auth/login", data);

export const signup = (data) =>
  api.post("/auth/signup", data);

export const googleLogin = (token) =>
  api.post("/auth/google", { token });

export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", {
    email,
  });

export const verifyOTP = (email, otp) =>
  api.post("/auth/verify-otp", {
    email,
    otp,
  });

export const resetPassword = (
  email,
  otp,
  new_password
) =>
  api.post("/auth/reset-password", {
    email,
    otp,
    new_password,
  });

export const refreshToken = (refresh_token) =>
  api.post("/auth/refresh", {
    refresh_token,
  });


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


export default api;