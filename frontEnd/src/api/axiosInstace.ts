
import axios from "axios";
import { LocalStorage } from "../utils";

// Create an Axios instance for API requests
const apiClient = axios.create({
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


// Response interceptor: handle expired token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await refreshAccessAndRefreshToken();
        const newAccessToken = res.data.accessToken;

        localStorage.setItem("accessToken", newAccessToken);
        apiClient.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest); // retry original request
      } catch (err) {
        // refresh failed → logout user
        console.error("Refresh failed", err);
        // redirect to login
      }
    }
    return Promise.reject(error);
  }
);



// API functions for refresh both access and refresh token
export const refreshAccessAndRefreshToken = ()=>{
  return apiClient.post("/api/auth/refresh")
}

// API functions for generating and saving question to the database
 export const generateAndSaveQuestions = (data: { topic: string }) => {
  return apiClient.post("/questions/v1", data);
};

// Api for fetching comparison data for the 7 jumuiyas
export const  fetchJumuiyaComparisonData = () =>{
  return apiClient.get("/csa/v1/jumuiya-comparison");
}

// Api for fetching user specific progress data
export const memberProgressData = ()=>{
 return apiClient.get("/member/v1/progress");
}

// Api for fetching user specific summary data of the progress
export const memberSummaryData = ()=>{
  return apiClient.get("/member/v1/summary")
}

// Api for fetching user specific progress data
export const individualJumuiAttemptsData =( jumuiyaId : string)=>{
  return apiClient.get(`/attempts/jumuiya/${jumuiyaId}`)
}



