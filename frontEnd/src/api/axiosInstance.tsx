
import axios from "axios";
import { LocalStorage } from "../utils";
import type { fileUpload } from "../interface/api";
import { normalizeFiles } from "../pages/Devotions/utitlty";

import { BASE_URL } from "./config";

// Create an Axios instance for API requests
export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 120000,
});


// Add an interceptor to set authorization header
apiClient.interceptors.request.use(
  (config) => {
    const userdata =LocalStorage.get('userdata');
    if (userdata && userdata.accessToken) {
      config.headers.Authorization = `Bearer ${userdata.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip interceptor for authentication routes (like /login) which intentionally return 401 on bad credentials
    const isAuthRoute = originalRequest.url?.includes('authentication/login') || originalRequest.url?.includes('authentication/refresh');

    // Handle 401 Unauthorized (Token expired)
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const userdata = LocalStorage.get('userdata');
        if (!userdata || !userdata.refreshToken) {
          throw new Error("No refresh token available");
        }

        // Call refresh endpoint using the clean refreshClient
        const { data } = await refreshAccessAndRefreshToken(userdata.refreshToken);

        // Update userdata with new tokens
        const updatedData = { 
          ...userdata, 
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || userdata.refreshToken
        };
        LocalStorage.set("userdata", updatedData);

        // Process any other waiting requests with the new token
        processQueue(null, data.accessToken);

        // Retry original request
        originalRequest.headers["Authorization"] = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        // Refresh failed → logout
        LocalStorage.remove("userdata");
        
        // Prevent redirect loop if already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = "/login?expired=true";
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);


// Create a separate instance for refresh to avoid interceptor recursion
const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URI,
});

// API functions for refresh both access and refresh token
const refreshAccessAndRefreshToken = (refreshToken: string) => {
  return refreshClient.post("authentication/refresh", { refreshToken });
};

// API functions for generating and saving question to the database
 export const generateAndSaveQuestions = (data: { topic: string }) => {
  return apiClient.post("/questions", data);
};

// Api for fetching daily questions with a limit
export const fetchDailyQuestions = (limit: number = 10) => {
  return apiClient.get(`/questions/?limit=${limit}`);
};


// Api for fetching comparison data for the 7 jumuiyas
export const  fetchJumuiyaComparisonData = () =>{
  return apiClient.get("/csa/jumuiya-comparison");
}

// Api for fetching gallery teaser images (unprotected)
export const fetchGalleryTeaser = () => {
  return apiClient.get("/gallery/teaser");
};

// Api for fetching user specific progress data
export const memberProgressData = (id: string | number) => {
 return apiClient.get(`/member/${id}/progress`);
}

// Api for fetching user specific summary data of the progress
export const memberSummaryData = (id: string | number) => {
  return apiClient.get(`/member/${id}/summary`)
}

// Api for fetching user specific progress data
export const individualJumuiAttemptsData =( jumuiyaId : number)=>{
  return apiClient.get(`/attempts/jumuiya/${jumuiyaId}`)
}

// Api for fetching notification data either at csa or jumuiya level
export const fetchNotifications = () =>{
  return apiClient.get( `/notifications`)
} 

export const createNotificationEventApi= (payload: { title: string; message: string; images?: fileUpload[]; posted_To?: string; status?: string;}) => {
  return apiClient.post("/notifications", payload);
};

// Api for uploading one or many files this may include images and videos, 
export const uploadFile = (files: File[] | File) => {
  const formData = new FormData();
  normalizeFiles(files).forEach((file) => formData.append("files", file));

  return apiClient.post("/files", formData, {headers: {"Content-Type": "multipart/form-data", },
  });
};


// ?api to handle fetching all uploaded files this
//  is useful for the admin to view all the uploaded files and manage them if needed
export const fetchAllUploadedFiles = () => {
  return apiClient.post("/files");
};



// Delete one or many files by publicId(s)
export const deleteOneOrMoreFiles = (publicIds: string | string[]) => {
  const ids = Array.isArray(publicIds) ? publicIds : [publicIds];
  return apiClient.delete("/files", {
    data: { publicIds: ids }, 
  });
};


export const loginApi = (data: { userReg: string; password: string }) => {
  return apiClient.post("/authentication/login", data);
};

export const initiateSTKPush = (data: { amount: number; phoneNumber: string }) => {
  return apiClient.post("/authentication/stk-push", data);
};

export const initiateGuestSTKPush = (data: { amount: number; phoneNumber: string }) => {
  return apiClient.post("/authentication/stk-push-guest", data);
};

export const getSTKPushStatus = (checkoutId: string) => {
  return apiClient.get(`/authentication/stk-push-status/${checkoutId}`);
};

export const resetEmailApi = (data: { email: string; password?: string; purpose: string }) => {
  return apiClient.post("/authentication/reset-email", data);
};

export const resetPasswordApi = (data: { email: string; password?: string; purpose: string }) => {
  return apiClient.post("/authentication/reset", data);
};
