import React, { useState } from "react";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, ChevronLeft, User } from "lucide-react";
import { loginApi } from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

interface ErrorResponse {
  message: string;
}

const Login: React.FC = () => {
  const [userReg, setUserReg] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async () => {
    if (!userReg || !password) return;
    try {
      setLoading(true);
      const response = await loginApi({ userReg, password });
      if (response.data.status === "success") {
        login(response.data);
      } else if (response.data.message === "User email not found") {
        alert("User email not found. Please reset your password.");
        login(response.data);
        navigate("reset", { state: { purpose: "email" } });
      } else {
        alert(response.data.message || "Login failed");
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      alert((axiosError.response?.data as ErrorResponse)?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4] px-6 py-12">
      
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
            Growing<br />Together in<br />
            <span className="text-amber-500">Faith.</span>
          </h2>
          
          <p className="text-lg text-gray-500 font-medium leading-relaxed mb-12 max-w-sm">
            Access your daily devotions, Rosary tracker, Jumuiya discussions, and community events purely in one place.
          </p>

          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            © {new Date().getFullYear()} CSA Kirinyaga Chapter
          </p>
        </div>

        {/* ══════════ RIGHT — Form Panel ══════════ */}
        <div className="w-full lg:w-[45%] px-0 sm:px-12 lg:px-0">
          
          {/* Back button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-400 hover:text-black text-[10px] font-black uppercase tracking-widest transition-colors group mb-10 w-fit"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </button>

          {/* Form Header */}
          <div className="mb-8 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Avatar (Mobile Only) */}
            <div className="relative mb-6 mt-2 lg:hidden">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full bg-black/5 scale-[1.3] animate-pulse" />
              {/* Avatar circle */}
              <div className="relative w-24 h-24 rounded-full bg-white shadow-xl shadow-gray-200/50 border border-gray-100 flex items-center justify-center">
                <User className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
              </div>
              {/* Status dot */}
              <div className="absolute bottom-1 right-2 w-5 h-5 rounded-full bg-green-500 border-2 border-white shadow-sm" />
            </div>

            <h1 className="text-3xl font-black text-gray-950 tracking-tight mt-1">Welcome back.</h1>
            <p className="text-sm text-gray-500 font-medium mt-2">Sign in to continue your journey</p>
          </div>

          {/* Fields */}
          <div className="space-y-6" onKeyDown={handleKeyDown}>

            {/* Registration */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 pl-1">
                Registration No.
              </label>
              <input
                type="text"
                value={userReg}
                onChange={(e) => setUserReg(e.target.value)}
                placeholder="e.g. KE/CSA/2024/001"
                className="w-full bg-gray-100 rounded-2xl px-5 py-4 text-sm font-black text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all border border-gray-200"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 pl-1">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-gray-100 rounded-2xl px-5 py-4 pr-12 text-sm font-black text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all border border-gray-200 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
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

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 accent-black cursor-pointer" />
                <span className="text-xs font-bold text-gray-500">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => navigate("reset", { state: { purpose: "reset password" } })}
                className="text-xs font-bold text-black hover:text-amber-500 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              onClick={submit}
              disabled={loading || !userReg || !password}
              className="w-full flex items-center justify-center gap-2.5 bg-black text-white font-black text-xs uppercase tracking-[0.2em] py-4 rounded-2xl shadow-xl shadow-gray-200 hover:bg-gray-900 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed group mt-4"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
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

export default Login;
