import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";

const Reset: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [userReg, setUserReg] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleReset = async () => {


    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3001/authorisation/reset",
        { email, userReg }
      );

      if (response.data.status === "success") {
        setMessage("OTP sent to your email!");
        // Navigate to OTP page with email as parameter
        setTimeout(() => {
          navigate(`/otp/${email}`, { state: { password } });
        }, 1500);
      } else {
        setError(response.data.message || "Failed to send OTP");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        {/* Back to FaHome Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center mb-4 text-sm text-gray-600 transition-colors hover:text-blue-600"
        >
          <FaHome className="w-4 h-4 mr-1" />
          Back to Home
        </button>

        <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
          Reset Password
        </h2>

        {message && (
          <div className="p-3 mb-4 text-green-700 bg-green-100 rounded-md">
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 mb-4 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>


          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              user Registration
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={userReg}
              onChange={(e) => setUserReg(e.target.value)}
              placeholder="Enter your user registration"
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

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              confirm Password
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
            />
          </div>


          <button
            onClick={handleReset}
            className="w-full px-4 py-2 text-white transition-colors bg-blue-700 rounded-md hover:bg-blue-800"
          >
            Send OTP
          </button>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-blue-600 hover:underline"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reset;
