import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import OTPInput from "./OTPInput";
import { ChevronLeft } from "lucide-react";
import { apiClient } from "../../api/axiosInstance";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const email = useParams().reg || "";
  const [countdown, setCountdown] = useState<number>(0);
  const [resending, setResending] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>(
    `A 6-digit verification code has been sent to ${email}. Please check your inbox and spam folder, then enter the code below. This message will stay here while you complete the reset.`
  );

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      setResending(true);
      await apiClient.post(`/authentication/resend-otp/${email}`);
      setNotice(`A new 6-digit verification code has been sent to ${email}. Please check your inbox and spam folder, then enter the newest code below.`);
      setCountdown(60); // 60 seconds cooldown
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleOTPComplete = async (otp: string) => {
    try {
      const { data, status } = await apiClient.post(`/authentication/otp/${email}`, { otp });
      
      if (status >= 200 && status < 300) {
        alert("OTP verified! You can now login with your new password.");
        navigate("/login", { replace: true });
      } else {
        alert(data.error || data.message || "Invalid OTP");
      }
    } catch (err: any) {
      console.error(err);
      const data = err.response?.data;
      alert(data?.error || data?.message || "Verification failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4] px-6 py-12 font-sans overflow-hidden relative">
      
      <div className="w-full max-w-md lg:max-w-5xl flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-24 relative z-10">

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
              We've sent a 6-digit code to <span className="font-bold text-black">{email}</span>.
            </p>
          </div>

          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold leading-relaxed text-emerald-800" role="status">
            {notice}
          </div>

          {/* OTP Component */}
          <div className="flex justify-center lg:justify-start w-full mb-6 mt-4">
            <OTPInput length={6} onComplete={handleOTPComplete} />
          </div>

          <p className="text-xs text-gray-400 font-medium text-center lg:text-left -mt-3">
            Tip: you can copy the code from your email and paste it directly into the boxes.
          </p>

          {/* Resend OTP */}
          <div className="text-center lg:text-left mt-6">
            <p className="text-sm text-gray-500 font-medium">
              Didn't receive the code?{" "}
              {countdown > 0 ? (
                <span className="text-gray-400 font-bold">Resend in {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-black hover:text-amber-500 font-black underline transition-colors disabled:opacity-50"
                >
                  {resending ? "Resending..." : "Resend OTP"}
                </button>
              )}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;

export const emailChecker=()=>{}