
import axios from "axios";
import { LocalStorage } from "../utils";
import type { fileUpload } from "../interface/api";
import { normalizeFiles } from "../pages/Devotions/utitlty";

// Create an Axios instance for API requests
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URI,
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

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (Token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const userdata = LocalStorage.get('userdata');
        if (!userdata || !userdata.refreshToken) {
          throw new Error("No refresh token available");
        }

        // Call refresh endpoint
        const { data } = await refreshAccessAndRefreshToken(userdata.refreshToken)

        // Update userdata with new accessToken
        const updatedData = { ...userdata, accessToken: data.accessToken };
        localStorage.setItem("userdata", JSON.stringify(updatedData));

        // Retry original request
        originalRequest.headers["Authorization"] = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (err) {
        // Refresh failed → logout
        localStorage.removeItem("userdata");
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);


// API functions for refresh both access and refresh token
 const refreshAccessAndRefreshToken = (refreshToken: any)=>{
  return apiClient.post("authentication/refresh" , {refreshToken});    
}

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

// Api for fetching user specific progress data
export const memberProgressData = ()=>{
 return apiClient.get("/member/:id/progress");
}

// Api for fetching user specific summary data of the progress
export const memberSummaryData = ()=>{
  return apiClient.get("/member/:id/summary")
}

// Api for fetching user specific progress data
export const individualJumuiAttemptsData =( jumuiyaId : number)=>{
  return apiClient.get(`/attempts/jumuiya/${jumuiyaId}`)
}

// Api for fetching notification data either at csa or jumuiya level
export const fetchNotifications = (jumuiyaId: number) =>{
  return apiClient.get( `/notifications?jumuiyaId=${jumuiyaId}&posted_to=csa`)
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
  return apiClient.post("/authentication/v1/login", data);
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