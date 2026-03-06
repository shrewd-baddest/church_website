import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Reset: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const navigate = useNavigate();

  const handleReset = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3001/authorisation/reset",
        { user: username }
      );

      if (response.data.status === "success") {
        alert("OTP sent to your email!");
        navigate(`/otp/${username}`);
      } else {
        alert(response.data.message || "Reset failed");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
        alert("Reset failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Reset Password
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
