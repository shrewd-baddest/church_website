import React, { useState } from "react";
import { AxiosError } from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { resetEmailApi, resetPasswordApi } from "../../api/axiosInstance";

interface ErrorResponse {
  message: string;
}

const Reset: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  
  const { state } = useLocation();
  const purpose = state?.purpose || "";
  const navigate = useNavigate();

  const handleReset = async () => {
    setMessage("");
    setError("");

    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      let response;
      if (purpose === "setting email") {
        response = await resetEmailApi({ email, password, purpose });
      } else {
        response = await resetPasswordApi({ email, password, purpose });
      }

      if (response.data.status === "success") {
        setMessage("OTP sent to your email!");
        setTimeout(() => {
          navigate(`/otp/{${email}`);
        }, 1500);
      } else {
        setError(response.data.message || "Failed to send OTP");
      }
    } catch (err: unknown) {
      const axiosError = err as AxiosError;
      setError((axiosError.response?.data as ErrorResponse)?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleReset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4] px-6 py-12 font-sans overflow-hidden relative">
      
      {/* ══════════ Main Container ══════════ */}
      <div className="w-full max-w-md lg:max-w-5xl flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-24 relative z-10">

        {/* ══════════ LEFT — Branding (Desktop only) ══════════ */}
        <div className="hidden lg:flex flex-col justify-center w-1/2 pl-10">
          
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shadow-xl shadow-gray-200">
              <span className="text-white font-black text-sm tracking-widest">CSA</span>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-gray-950 font-black text-xl tracking-tight leading-none mb-1">Catholic Students</span>
              <span className="text-amber-500 font-black text-sm tracking-tight leading-none">Association</span>
            </div>
          </div>
          
          <div className="w-10 h-[3px] bg-amber-500 mb-8 rounded-full" />
          
          <h2 className="text-6xl font-black text-gray-950 leading-[1.05] tracking-tight mb-6">
            Securely<br />Update your<br />
            <span className="text-amber-500">Access.</span>
          </h2>
          
          <p className="text-lg text-gray-500 font-medium leading-relaxed mb-12 max-w-sm">
            Keep your account secure to ensure uninterrupted access to the community hub, rosary tracker, and daily devotions.
          </p>

          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            © {new Date().getFullYear()} CSA Kirinyaga Chapter
          </p>
        </div>

        {/* ══════════ RIGHT — Form Panel ══════════ */}
        <div className="w-full lg:w-[45%] px-0 sm:px-12 lg:px-0">
          
          {/* Back button */}
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-gray-400 hover:text-black text-[10px] font-black uppercase tracking-widest transition-colors group mb-10 w-fit mr-auto"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Login
          </button>

          {/* Header */}
          <div className="mb-8 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shadow-lg shadow-gray-200 mb-6 relative">
              <div className="absolute inset-0 rounded-2xl bg-black/5 scale-[1.3] animate-pulse lg:hidden" />
              <span className="text-white font-black text-xs tracking-wider relative z-10">CSA</span>
            </div>
            <h1 className="text-3xl font-black text-gray-950 tracking-tight mt-1">
              {purpose === "setting email" ? "Update Email" : "Reset Password"}
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-2 max-w-[260px] lg:max-w-none">
              Enter your details below to receive a secure OTP.
            </p>
          </div>

          {/* Messaging */}
          {(message || error) && (
            <div className={`p-4 mb-6 rounded-2xl text-sm font-bold border ${message ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {message || error}
            </div>
          )}

          {/* Fields */}
          <div className="space-y-6" onKeyDown={handleKeyDown}>

            {/* Email */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 pl-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. member@csa.com"
                className="w-full bg-gray-100 rounded-2xl px-5 py-4 text-sm font-black text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all border border-gray-200"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 pl-1">
                New Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-gray-100 rounded-2xl px-5 py-4 pr-12 text-sm font-black text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all border border-gray-200 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-0 bottom-0 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 pl-1">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-gray-100 rounded-2xl px-5 py-4 pr-12 text-sm font-black text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all border border-gray-200 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-0 bottom-0 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleReset}
              disabled={loading || !email || !password || !confirmPassword}
              className="w-full flex items-center justify-center gap-2.5 bg-black text-white font-black text-xs uppercase tracking-[0.2em] py-4 rounded-2xl shadow-xl shadow-gray-200 hover:bg-gray-900 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed group mt-4"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send OTP
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reset;
