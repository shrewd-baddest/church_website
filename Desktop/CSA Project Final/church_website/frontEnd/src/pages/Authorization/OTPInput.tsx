import React, { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const OTPInput: React.FC = () => {
  const [otp, setOtp] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const { reg } = useParams<{ reg: string }>();
  const { state } = useLocation();

  const passwordFromReset = state?.password || "";
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleVerify = async () => {
    try {
      const response = await axios.post(
        `http://localhost:3001/authorisation/otp/${reg}`,
        { otp, passWord: passwordFromReset }
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
          Verify OTP
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
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
            <label className="block mb-1 text-sm font-medium text-gray-700">
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
            className="w-full px-4 py-2 text-white transition-colors bg-blue-700 rounded-md hover:bg-blue-800"
          >
            Verify & Reset Password
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

export default OTPInput;
