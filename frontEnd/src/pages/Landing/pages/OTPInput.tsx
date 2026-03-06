import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../AuthContext";

const OTPInput: React.FC = () => {
  const [otp, setOtp] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const { reg } = useParams<{ reg: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleVerify = async () => {
    try {
      const response = await axios.post(
        `http://localhost:3001/authorisation/otp/${reg}`,
        { otp, passWord: newPassword }
      );

      if (response.data.status === "success") {
        // Auto-login after password reset
        login(response.data.user, response.data.token);
        alert("Password reset successful!");
        navigate("/");
      } else {
        alert(response.data.message || "Verification failed");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
        alert("Verification failed. Please check your OTP.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Verify OTP
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter OTP
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>

          <button
            onClick={handleVerify}
            className="w-full bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-800 transition-colors"
          >
            Verify & Reset Password
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

export default OTPInput;
