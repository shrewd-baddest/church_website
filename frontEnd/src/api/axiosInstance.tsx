

import axios from "axios";
import { LocalStorage } from "../utils";

// Create an Axios instance for API requests
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URI,
  withCredentials: true,
  timeout: 120000,
});

// Add an interceptor to set authorization header with user token before requests
apiClient.interceptors.request.use(
  function (config) {
    // Retrieve user token from local storage
    const token = LocalStorage.get("token");
    // Set authorization header with bearer token
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },

  function (error) {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only retry once to avoid infinite loop
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token found");

        // Call refresh endpoint
        const { data } = await axios.post(`${import.meta.env.VITE_SERVER_URI}/authentication/v1/refresh`, { refreshToken });

        // Save new access token
        localStorage.setItem("accessToken", data.accessToken);

        // Retry original request with new token
        originalRequest.headers["Authorization"] = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (err) {
        // Refresh failed → logout user
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);



// API functions for different actions
export const generateAndSaveQuestions = (data: { topic: string }) => {
  return apiClient.post("/questions/v1", data);
};

export const initiateSTKPush = (data: { amount: number; phoneNumber: string }) => {
  return apiClient.post("/authentication/v1/stk-push", data);
};

export const initiateGuestSTKPush = (data: { amount: number; phoneNumber: string }) => {
  return apiClient.post("/authentication/v1/stk-push-guest", data);
};

export const getSTKPushStatus = (checkoutId: string) => {
  return apiClient.get(`/authentication/v1/stk-push-status/${checkoutId}`);
};