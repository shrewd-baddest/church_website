import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";

interface ErrorResponse {
  message: string;
}

const Login: React.FC = () => {
  const [userReg, setUserReg] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  // const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async () => {
    console.log("Submitting login with:", { userReg, password });
    try {
      const response = await axios.post(
        "http://localhost:3001/authentication/v1/login",
        {
          userReg,
          password,
        }
      );
      console.log("Login response:", response.data);

      if (response.data.status === "success") {
        localStorage.setItem("token", response.data.token);
        navigate("/", { state: { Response: true } });
      }
      else if (response.data.error == "User email not found") {
        alert("Login User email not found. Please enter your email and change your password.");
        localStorage.setItem("token", response.data.token);
        navigate("reset", { state: { purpose: 'email' } });

      }

      else {
        alert(response.data.message || "Login failed");
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error("Login error:", error);

      alert((axiosError.response?.data as ErrorResponse)?.message || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        {/* Back to   FaHome Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center mb-4 text-sm text-gray-600 transition-colors hover:text-blue-600"
        >
          < FaHome className="w-4 h-4 mr-1" />
          Back to  Home
        </button>

        <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
          Welcome Back
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              User Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={userReg}
              onChange={(e) => setUserReg(e.target.value)}
              placeholder="Enter your userReg"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
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
            className="w-full px-4 py-2 text-white transition-colors bg-blue-700 rounded-md hover:bg-blue-800"
          >
            Sign In
          </button>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('reset', { state: { purpose: 'reset password' } })}
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



