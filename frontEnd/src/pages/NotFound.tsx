import { useNavigate } from "react-router-dom";
import { Home, BookOpen, Image, ArrowRight } from "lucide-react";

const quickLinks = [
  { label: "Go Home", path: "/", icon: Home, bg: "bg-blue-50 hover:bg-blue-100 shadow-blue-100", text: "text-blue-800" },
  { label: "Daily Devotion", path: "/devotions", icon: BookOpen, bg: "bg-amber-50 hover:bg-amber-100 shadow-amber-100", text: "text-amber-800" },
  { label: "Gallery", path: "/gallery", icon: Image, bg: "bg-gray-100 hover:bg-gray-200 shadow-gray-200", text: "text-gray-800" },
];

export default function NotFound() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-24 bg-white">

      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />

      <div className="flex flex-col items-center text-center max-w-md w-full">

        {/* Avatar */}
        <div className="relative mb-10">
          <div className="w-36 h-36 rounded-full bg-gray-50 border-2 border-gray-200 shadow-xl flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-24 h-24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Head */}
              <circle cx="50" cy="45" r="28" fill="#FDE68A" stroke="#FCD34D" strokeWidth="2"/>
              {/* Eyes */}
              <ellipse cx="40" cy="40" rx="4" ry="5" fill="#111827"/>
              <ellipse cx="60" cy="40" rx="4" ry="5" fill="#111827"/>
              {/* Confused eyebrows */}
              <path d="M35 33 Q40 29 45 33" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <path d="M55 33 Q60 29 65 33" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              {/* Sad mouth */}
              <path d="M40 56 Q50 51 60 56" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              {/* Sweat drop */}
              <ellipse cx="70" cy="32" rx="3" ry="4" fill="#93C5FD" />
            </svg>
          </div>

          {/* 404 Tag */}
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black text-white text-[11px] font-black px-4 py-1 rounded-full tracking-widest uppercase shadow-lg">
            404
          </span>
        </div>

        {/* Label */}
        <p className="text-xs font-black text-blue-600 uppercase tracking-[0.35em] mb-3">
          Page Not Found
        </p>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl font-black text-black tracking-tight leading-tight mb-5">
          You seem lost.
        </h1>

        {/* Description */}
        <p className="text-base text-black font-medium leading-relaxed mb-10">
          The page you're looking for doesn't exist or has been moved.
          Let us guide you to the right place.
        </p>

        {/* Quick Links */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {quickLinks.map(({ label, path, icon: Icon, bg, text }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex-1 flex items-center justify-between gap-2 px-5 py-4 rounded-2xl ${bg} ${text} text-sm font-bold shadow-lg transition-all duration-300 group active:scale-95 hover:shadow-xl`}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {label}
              </div>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px w-24 bg-gray-200 my-10" />

        {/* Footer */}
        <p className="text-xs font-bold text-black uppercase tracking-[0.25em]">
          CSA Kirinyaga &bull; {currentYear}
        </p>
      </div>
    </div>
  );
}
