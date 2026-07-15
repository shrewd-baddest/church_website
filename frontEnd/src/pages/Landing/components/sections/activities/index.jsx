// src/pages/Landing/components/sections/activities/index.jsx
// Mirrors repo's ActivitiesSection structure: loadActivities, groupedActivities,
// same loading/error states, same card design system (white bg, slate text, blue accents)
import { useState, useEffect } from "react";
import { useCachedData } from "../../../../../hooks/useCachedData";
import { Clock, MapPin, Calendar, RefreshCw, Activity, Zap, X, CreditCard, CheckCircle, Loader2 } from "lucide-react";
import apiService from "../../../services/api";
import activitiesService from "../../../../../api/activitiesServices";
import { useAuth } from "../../../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useCountdown from "../../../../../hooks/useCountdown";

// ── Activity icons — matches repo's emoji/icon style ──────────────
const ACTIVITY_ICONS = {
  "Rosary":         "📿",
  "Choir Practice": "🎵",
  "Bible Study":    "📖",
  "Mass":           "⛪",
};

// ── Day accent colours — slate palette matching repo's design system ─
const DAY_COLORS = {
  Monday:    "border-l-blue-400   bg-blue-50/40",
  Tuesday:   "border-l-purple-400 bg-purple-50/40",
  Wednesday: "border-l-emerald-400 bg-emerald-50/40",
  Thursday:  "border-l-amber-400  bg-amber-50/40",
  Friday:    "border-l-rose-400   bg-rose-50/40",
  Saturday:  "border-l-indigo-400 bg-indigo-50/40",
  Sunday:    "border-l-slate-400  bg-slate-50/40",
};
const ACTIVITY_IMAGES = {
  Monday: "/images/rosary_prayers.jpg",
  Tuesday: "/images/choir.png",
  Wednesday: "/images/biblestudy.webp",
  Thursday: "/images/rosary_prayers.jpg",
  Friday: "/images/mass.webp",
  Saturday: "/images/sta-choir.png",
};

// ── Image mapping for Weekly Activities ───────────────────────────
const DEFAULT_ACTIVITY_IMAGE = "/images/church.png";

const getWeeklyActivityImage = (activity) => {
  const title = String(activity?.activity || "").trim();
  const day = String(activity?.day || "").trim();

  // Requirements mapping
  if (title === "Saturday Choir Practice") return "/images/sta choir.png";
  if (title === "Tuesday Choir Practice") return "/images/choir.png";

  if (title === "Monday Rosary Prayers") return  "/images/rosary_prayers.jpg";
  if (title === "Thursday Rosary Prayers") return  "/images/rosary_prayers.jpg";

  if (title === "Wednesday Bible Study") return "/images/biblestudy.webp";

  if (title === "Friday Mass") return "/images/mass.webp";

  // Defensive mapping if titles don’t match exactly (based on day)
  if (day === "Saturday") return "/images/sta choir.png";
  if (day === "Tuesday") return "/images/choir.png";
  if (day === "Wednesday") return "/images/biblestudy.webp";
  if (day === "Monday" || day === "Thursday") return "/images/rosary_prayers.jpg";
  if (day === "Friday") return "/images/mass.webp";

  return null;
};

function BookingModal({ activity, onClose }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePay = async (e) => {
    e.preventDefault();
    const cleaned = phone.replace(/\s+/g, "").replace(/^0/, "254");
    if (!cleaned || cleaned.length < 10) {
      toast.error("Enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      const res = await activitiesService.bookActivity(
        activity._type || "weekly",
        activity.id,
        cleaned
      );
      setSuccess(true);
      toast.success("STK Push sent! Check your phone.");
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Booking failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {success ? (
          <div className="text-center py-6">
            <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">STK Push Sent!</h3>
            <p className="text-sm text-slate-500">Check your phone to complete payment for <strong>{activity.activity || activity.title}</strong></p>
            <button onClick={onClose} className="mt-6 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Book & Pay</h3>
              <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-slate-500 mb-1">{activity.activity || activity.title}</p>
            <p className="text-2xl font-black text-emerald-600 mb-4">KES {Number(activity.fare).toLocaleString()}</p>
            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">M-Pesa Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712 345 678"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  required
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><CreditCard size={16} /> Pay via M-Pesa</>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Weekly Activity Card ───────────────────────────────────────────
// ── Weekly Activity Card ───────────────────────────────────────────
function WeeklyCard({ activity, onBook }) {
  const colorClass = DAY_COLORS[activity.day] || "border-l-gray-300 bg-gray-50/40";
  const icon = ACTIVITY_ICONS[activity.activity] || "✝";

  const mappedImage = getWeeklyActivityImage(activity);
  const imgSrc = mappedImage || DEFAULT_ACTIVITY_IMAGE;

  const getNextWeeklyOccurrence = () => {
    const dayToIndex = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    const targetDayIndex = dayToIndex[(activity.day || "").trim()];
    if (targetDayIndex === undefined) return null;

    const timeStr = String(activity.time || "").trim();
    const now = new Date();

    let hours = 0;
    let minutes = 0;

    const m24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (m24) {
      hours = Number(m24[1]);
      minutes = Number(m24[2]);
    } else {
      const m12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (m12) {
        hours = Number(m12[1]);
        minutes = Number(m12[2]);
        const ampm = m12[3].toUpperCase();
        if (ampm === "PM" && hours < 12) hours += 12;
        if (ampm === "AM" && hours === 12) hours = 0;
      }
    }

    const daysUntil = (targetDayIndex - now.getDay() + 7) % 7;
    const target = new Date(now);
    target.setDate(now.getDate() + daysUntil);
    target.setHours(hours, minutes, 0, 0);

    if (target <= now) {
      target.setDate(target.getDate() + 7);
    }

    return target;
  };

  const nextOccurrence = getNextWeeklyOccurrence();
  const { isValid, days, hours, minutes, seconds } = useCountdown(nextOccurrence ?? null);

  const timerText = !isValid
    ? "Starts soon"
    : days > 0
      ? `Starts in ${days}d ${hours}h ${minutes}m`
      : `Starts in ${hours}h ${minutes}m ${seconds}s`;

  return (
    <div
      className={`bg-white rounded-2xl border-l-4 ${colorClass} border border-slate-100 p-5
        hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.08)] transition-all duration-500
        hover:-translate-y-0.5 cursor-default group`}
    >
      <img
        src={imgSrc}
        alt={activity.activity}
        className="w-full h-56 object-cover rounded-xl mb-4"
        loading="lazy"
      />
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] font-black text-slate-400 tracking-[0.25em] uppercase mb-1">{activity.day}</p>
          <h4 className="text-base font-black text-slate-800 group-hover:text-primary transition-colors duration-300">
            {icon} {activity.activity}
          </h4>
        </div>
      </div>
      <div className="space-y-1.5 text-xs font-medium text-slate-500">
        <p className="flex items-center gap-2">
          <Clock size={12} className="text-primary/60" />{activity.time}
        </p>
        <p className="text-[11px] text-slate-600 font-semibold">⏳ {timerText}</p>
        <p className="flex items-center gap-2">
          <MapPin size={12} className="text-primary/60" />{activity.venue}
        </p>
        {activity.fare && (
          <button onClick={() => onBook(activity, "weekly")}
            className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5">
            <CreditCard size={12} /> Book Now — KES {Number(activity.fare).toLocaleString()}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Semester Event Card ────────────────────────────────────────────
function SemesterCard({ event, onBook }) {
  const dt = new Date(event.date_time);
  const isPast = dt < new Date();

  const { isValid, days, hours, minutes, seconds } = useCountdown(event.date_time ?? null);

  const timerText = !isValid
    ? "No date set"
    : days > 0
      ? `Starts in ${days}d ${hours}h ${minutes}m`
      : `Starts in ${hours}h ${minutes}m ${seconds}s`;

  return (
    <div
      className={`group bg-white rounded-[1.5rem] border border-slate-100
        hover:border-slate-200 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)]
        transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] p-6 cursor-default
        ${isPast ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          {isPast && (
            <span className="inline-block text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full tracking-widest uppercase mb-2">
              Past Event
            </span>
          )}
          <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-primary transition-colors duration-300">
            {event.title}
          </h3>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            {event.description}
          </p>
        </div>
      </div>

      <div className="h-px w-full bg-slate-100 mb-4" />

      <div className="space-y-2 text-xs font-medium text-slate-500">
        <p className="flex items-center gap-2">
          <Calendar size={12} className="text-primary/60" />
          {dt.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
        <p className="flex items-center gap-2">
          <Clock size={12} className="text-primary/60" />
          {dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className="text-[11px] text-slate-600 font-semibold">⏳ {timerText}</p>
        <p className="flex items-center gap-2">
          <MapPin size={12} className="text-primary/60" />
          {event.venue}
        </p>
        {event.fare && (
          <button onClick={() => onBook(event, "semester")}
            className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5">
            <CreditCard size={12} /> Book Now — KES {Number(event.fare).toLocaleString()}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Booking Modal ──────────────────────────────────────────────────
// ── Main Section ───────────────────────────────────────────────────
const ActivitiesSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookingActivity, setBookingActivity] = useState(null);

  const handleBook = (activity, type) => {
    if (!user) {
      toast.error("Please log in first");
      navigate("/login");
      return;
    }
    setBookingActivity({ ...activity, _type: type });
  };

  const { data: activitiesData, loading, error, refetch: loadActivities } = useCachedData(
    'csa_cache_public_activities',
    async () => {
      const [weeklyData, semesterData] = await Promise.all([
        apiService.getWeeklyActivities(),
        apiService.getSemesterActivities(),
      ]);
      return { weekly: weeklyData, semester: semesterData };
    },
    { weekly: [], semester: [] }
  );

  const weekly = activitiesData.weekly || [];
  const semester = activitiesData.semester || [];

  if (loading) {
    return (
      <div id="activities" className="py-8 md:py-16 bg-gray-50">
        <div className="container mx-auto px-3 md:px-4 text-center">
          <p className="text-gray-500">Loading activities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="activities" className="py-8 md:py-16 bg-gray-50">
        <div className="container mx-auto px-3 md:px-4 text-center space-y-4">
          <p className="text-red-500">{error}</p>
          <button onClick={loadActivities}
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-full text-sm font-bold transition-all hover:bg-primary-dark">
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="activities" className="py-12 md:py-20 bg-slate-50 relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48 opacity-60 pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase mb-8 shadow-sm border border-slate-100">
            <Zap size={12} className="text-primary/40" />
            Our Schedule
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
            CSA <span className="text-primary/80">Activities</span>
          </h2>
          <p className="text-slate-500 font-medium text-base leading-relaxed max-w-xl mx-auto">
            Join us throughout the week and semester for prayer, worship, fellowship, and service.
          </p>
        </div>

        {/* Weekly Schedule */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 tracking-[0.25em] uppercase mb-1">Every Week</p>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Weekly Schedule</h3>
            </div>
          </div>

          {weekly.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <Activity size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-medium text-sm">No weekly activities yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {weekly.map((a) => (
                <WeeklyCard key={a.id} activity={a} onBook={handleBook} />
              ))}
            </div>
          )}
        </div>

        {/* Semester Events */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 tracking-[0.25em] uppercase mb-1">This Semester</p>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Semester Events</h3>
            </div>
          </div>

          {semester.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <Calendar size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-medium text-sm">No semester events yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {semester.map((e) => (
                <SemesterCard key={e.id} event={e} onBook={handleBook} />
              ))}
            </div>
          )}
        </div>
      </div>
      {bookingActivity && (
        <BookingModal
          activity={bookingActivity}
          onClose={() => setBookingActivity(null)}
        />
      )}
    </div>
  );
};

export default ActivitiesSection;