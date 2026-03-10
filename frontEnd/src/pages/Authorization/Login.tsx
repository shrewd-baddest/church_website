import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {  FaHome } from "react-icons/fa";

interface ErrorResponse {
  message: string;
}

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async () => {
    console.log("Submitting login with:", { username, password });
    try {
      const response = await axios.post(
        "http://localhost:3001/authentication/login",
        {
          username,
          password,
        }
      );
      console.log("Login response:", response.data);

      if (response.data.status === "success") {
        console.log("Full response data keys:", Object.keys(response.data));
        console.log("User data:", response.data.user);
        console.log("Token data:", response.data.token);
        login(response.data.user, response.data.token);
        navigate("/");
      } else {
        alert(response.data.message || "Login failed");
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error("Login error:", error);
      console.error("Error response:", axiosError.response?.data);
      console.error("Error status:", axiosError.response?.status);
      alert((axiosError.response?.data as ErrorResponse)?.message || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        {/* Back to   FaHome Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-sm text-gray-600 hover:text-blue-600 mb-4 transition-colors"
        >
          < FaHome className="w-4 h-4 mr-1" />
          Back to  Home
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Welcome Back
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <div className="flex items-center">
            <input type="checkbox" id="remember" className="mr-2" />
            <label htmlFor="remember" className="text-sm text-gray-600">
              Remember me
            </label>
          </div>

          <button
            onClick={submit}
            className="w-full bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-800 transition-colors"
          >
            Sign In
          </button>

          <div className="text-center mt-4">
            <button
              onClick={() => navigate('reset')}
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
