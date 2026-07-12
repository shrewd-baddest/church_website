import { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, ChevronLeft, Shield, Mail, KeyRound, Loader2, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { apiClient } from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

export default function FirstLoginSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const loginResponse = location.state?.loginResponse;
  const member_id = loginResponse?.member_id || "";
  const memberName = loginResponse?.name || "";
  const hasEmail = loginResponse?.hasEmail ?? false;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!member_id) return;
    setResending(true);
    try {
      await apiClient.post("/authentication/resend-verification", { member_id });
      toast.success("Verification email resent! Please check your inbox.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to resend. Try again later.");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!hasEmail && !email.trim()) {
      toast.error("Email is required");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/authentication/first-login-setup", {
        member_id,
        currentPassword: member_id,
        newPassword,
        email: hasEmail ? undefined : email.trim(),
      });
      toast.success("Password updated successfully");

      setDone(true);

      if (hasEmail) {
        // Already had email — no verification needed, log in and redirect
        login(loginResponse);
        const role = loginResponse?.role;
        const hasRole = Array.isArray(role) ? role.length > 0 : !!role;
        if (hasRole) {
          const savedPath = sessionStorage.getItem('admin_last_path');
          setTimeout(() => navigate(savedPath && savedPath.startsWith('/admin') ? savedPath : '/admin'), 1500);
        } else {
          setTimeout(() => navigate('/'), 1500);
        }
      }
      // else: no email → just provided one → must verify first.
      // Don't log in, don't redirect — show the check-email screen.
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4] px-6">
        <div className="text-center space-y-4 max-w-sm">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
          {hasEmail ? (
            <>
              <h2 className="text-2xl font-black text-gray-950">All set!</h2>
              <p className="text-gray-500 font-medium">Redirecting to dashboard...</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-black text-gray-950">Check your email</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800 font-medium">
                  A verification link has been sent to <strong>{email}</strong>. Please check your inbox and click the link to verify your email before logging in.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center justify-center gap-2 bg-black text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-gray-900 transition-all"
                >
                  Go to Login
                </button>
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="inline-flex items-center justify-center gap-2 border-2 border-slate-300 text-slate-700 font-bold text-sm px-6 py-3 rounded-xl hover:bg-slate-100 disabled:opacity-50 transition-all"
                >
                  {resending ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  {resending ? "Sending..." : "Resend Email"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4] px-6 py-12">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-gray-400 hover:text-black text-[10px] font-black uppercase tracking-widest transition-colors group mb-10 w-fit"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Login
        </button>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 backdrop-blur-md flex items-center justify-center mb-4 border border-amber-500/30">
              <Shield className="w-7 h-7 text-amber-400" />
            </div>
            <h1 className="text-2xl font-black">First-Time Setup</h1>
            <p className="text-slate-300 text-sm mt-1">
              Welcome, <span className="font-bold text-white">{memberName || member_id}</span>. Please set a new password to continue.
            </p>
          </div>

          <div className="p-8 space-y-6">
            {!hasEmail && (
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 pl-1">
                  <Mail className="inline w-3 h-3 mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-gray-100 rounded-2xl px-5 py-4 text-sm font-black text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all border border-gray-200"
                />
                <p className="text-xs text-amber-600 font-medium mt-1.5 pl-1">
                  An email is required to enable password recovery.
                </p>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 pl-1">
                <KeyRound className="inline w-3 h-3 mr-1" />
                New Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-gray-100 rounded-2xl px-5 py-4 pr-12 text-sm font-black text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all border border-gray-200"
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

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 pl-1">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-gray-100 rounded-2xl px-5 py-4 text-sm font-black text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all border border-gray-200"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 bg-black text-white font-black text-xs uppercase tracking-[0.2em] py-4 rounded-2xl shadow-xl shadow-gray-200 hover:bg-gray-900 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save & Continue"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
