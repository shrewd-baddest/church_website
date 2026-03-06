import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

const Reset: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleReset = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3001/authorisation/reset",
        { user: username }
      );

      if (response.data.status === "success") {
        setMessage("OTP sent to your email!");
        // Navigate to OTP page with username as parameter
        setTimeout(() => {
          navigate(`/otp/${username}`);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        {/* Back to Home Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-sm text-gray-600 hover:text-blue-600 mb-4 transition-colors"
        >
          <Home className="w-4 h-4 mr-1" />
          Back to Home
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Reset Password
        </h2>
        
        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {message}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

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

          <button
            onClick={handleReset}
            className="w-full bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-800 transition-colors"
          >
            Send OTP
          </button>

          <div className="text-center mt-4">
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
