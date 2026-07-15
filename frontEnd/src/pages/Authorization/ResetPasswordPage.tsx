import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import OTPInput from "./OTPInput";
import { ChevronLeft } from "lucide-react";
import { apiClient } from "../../api/axiosInstance";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const token = useParams().reg || "";
  const [resending, setResending] = useState(false);

  const handleOTPComplete = async (otp: string) => {
    try {
      const { data, status } = await apiClient.post(`/authentication/otp/${token}`, { otp });
      
      if (status >= 200 && status < 300) {
        alert("OTP Verified! You can now use your new password.");
        navigate("/login", { replace: true });
      } else {
        alert(data.message || "Invalid OTP");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Verification failed. Please try again.";
      alert(msg);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { data } = await apiClient.post("/authentication/resend-otp", { token });
      alert(data.message || "OTP resent to your email");
    } catch {
      alert("Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4] px-6 py-12 font-sans overflow-hidden relative">
      
      {/* ══════════ Main Container ══════════ */}
      <div className="w-full max-w-md lg:max-w-5xl flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-24 relative z-10">

        {/* ══════════ LEFT — Branding (Desktop only) ══════════ */}
        <div className="hidden lg:flex flex-col justify-center w-1/2 pl-10">
          
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
            Verify<br />Your <span className="text-amber-500">Identity.</span>
          </h2>
          
          <p className="text-lg text-gray-500 font-medium leading-relaxed mb-12 max-w-sm">
            Enter the secure 6-digit verification code sent to your email to safely access your account.
          </p>

          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            © {new Date().getFullYear()} CSA Kirinyaga Chapter
          </p>
        </div>

        {/* ══════════ RIGHT — Form Panel ══════════ */}
        <div className="w-full lg:w-[45%] px-0 sm:px-12 lg:px-0">
          
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-black text-[10px] font-black uppercase tracking-widest transition-colors group mb-10 w-fit mr-auto"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Go Back
          </button>

          {/* Header */}
          <div className="mb-8 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shadow-lg shadow-gray-200 mb-6 relative">
              <div className="absolute inset-0 rounded-2xl bg-black/5 scale-[1.3] animate-pulse lg:hidden" />
              <span className="text-white font-black text-xs tracking-wider relative z-10">CSA</span>
            </div>
            <h1 className="text-3xl font-black text-gray-950 tracking-tight mt-1">
              Check your email.
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-2 max-w-[260px] lg:max-w-none">
              We've sent a 6-digit code to your email.
            </p>
          </div>

          {/* OTP Component */}
          <div className="flex justify-center lg:justify-start w-full mb-6 mt-4">
            <OTPInput length={6} onComplete={handleOTPComplete} />
          </div>

          {/* Resend OTP */}
          <div className="text-center lg:text-left">
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-xs font-bold text-gray-500 hover:text-black transition-colors underline underline-offset-2 disabled:opacity-40"
            >
              {resending ? "Resending..." : "Resend OTP"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;