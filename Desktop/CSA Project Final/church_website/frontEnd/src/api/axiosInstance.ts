import axios from "axios";
import { LocalStorage } from "../utils";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URI,
  withCredentials: true,
  timeout: 120000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = LocalStorage.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const generateAndSaveQuestions = async (data: { topic: string }) => {
  return axiosInstance.post('/v1/generate-questions', data);
};

export default axiosInstance;
