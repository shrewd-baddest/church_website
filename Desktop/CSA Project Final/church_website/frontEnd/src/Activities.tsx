import React, { useEffect, useState } from "react";

/* ---------------- TYPES ---------------- */
interface WeeklyActivity {
  id: number;
  day: string;
  time: string;
  activity: string;
  venue: string;
  imageUrl: string;
}

interface SemesterActivity {
  id: number;
  title: string;
  datetime: string;
  venue: string;
  description: string;
}

/* ---------------- WEEKLY DATA ---------------- */
const weeklyActivities: WeeklyActivity[] = [
  { id:1, day:"Monday", time:"7:30 PM", activity:"Rosary", venue:"Church", imageUrl:"/images/rosary.jpg" },
  { id:2, day:"Tuesday", time:"6:00 PM", activity:"Choir Practice", venue:"Church", imageUrl:"/images/choir.png" },
  { id:3, day:"Wednesday", time:"7:00 PM", activity:"Bible Study", venue:"Church", imageUrl:"/images/mass.webp" },
  { id:4, day:"Thursday", time:"7:30 PM", activity:"Rosary", venue:"Church", imageUrl:"/images/rosary.jpg" },
  { id:5, day:"Friday", time:"7:00 PM", activity:"Mass", venue:"Church", imageUrl:"/images/mass.webp" },
  { id:6, day:"Saturday", time:"1:00 PM", activity:"Choir Practice", venue:"School", imageUrl:"/images/choir2.png" },
];

/* ---------------- FIXED SEMESTER IMAGES ---------------- */
const semesterImages: Record<string,string> = {
  "Recollection Day": "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
  "Charity Work": "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b",
  "Fun Day": "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf",
  "4th Years' Bash": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30"
};

/* ---------------- TIMER ---------------- */
const useNow = () => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  return now;
};

const getCountdown = (target: Date, now: number) => {
  const diff = target.getTime() - now;
  if (diff <= 0) return { d:0,h:0,m:0,s:0 };

  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
};

/* ---------------- WEEKLY DATE FIX ---------------- */
const getNextWeeklyDate = (day: string, time: string) => {
  const days:any = {Sunday:0,Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6};
  const now = new Date();

  const target = new Date(now);
  const diff = (days[day] - now.getDay() + 7) % 7;
  target.setDate(now.getDate() + diff);

  const [t, mod] = time.split(" ");
  let [h,m] = t.split(":").map(Number);

  if (mod === "PM" && h !== 12) h += 12;
  if (mod === "AM" && h === 12) h = 0;

  target.setHours(h, m || 0, 0);

  if (target <= now) target.setDate(target.getDate() + 7);

  return target;
};

/* ---------------- SEMESTER FILTER ---------------- */
const getCurrentSemesterRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (month <= 3) return { start:new Date(year,0,1), end:new Date(year,3,30) };
  if (month <= 7) return { start:new Date(year,4,1), end:new Date(year,7,31) };
  return { start:new Date(year,8,1), end:new Date(year,11,31) };
};

/* ---------------- COLORS ---------------- */
const getLiturgicalColor = () => {
  const m = new Date().getMonth();
  if ([11,0].includes(m)) return "from-purple-900 to-purple-600";
  if ([2,3].includes(m)) return "from-purple-800 to-pink-600";
  if ([3,4].includes(m)) return "from-yellow-300 to-white";
  return "from-green-700 to-emerald-400";
};

/* ---------------- COMPONENT ---------------- */
const Activities: React.FC = () => {
  const [semester, setSemester] = useState<SemesterActivity[]>([]);
  const now = useNow();

  useEffect(() => {
    fetch("/api/semester")
      .then(res => res.json())
      .then(data => setSemester(data))
      .catch(()=>{});
  }, []);

  const { start, end } = getCurrentSemesterRange();

  const filteredSemester = semester.filter(e => {
    const d = new Date(e.datetime);
    return d >= start && d <= end;
  });

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getLiturgicalColor()} text-white p-10`}>

      {/* WEEKLY */}
      <h2 className="text-3xl font-extrabold mb-6 tracking-wide">Weekly Activities</h2>
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {weeklyActivities.map(w => {
          const next = getNextWeeklyDate(w.day, w.time);
          const c = getCountdown(next, now);

          return (
            <div key={w.id} className="p-6 bg-white/10 rounded-2xl backdrop-blur-lg shadow-xl hover:scale-105 transition">

              <img src={w.imageUrl} className="h-32 w-full object-cover rounded mb-3"/>

              <h3 className="text-lg font-bold tracking-wide">{w.activity}</h3>

              {/* DAY + TIME */}
              <p className="inline-block mt-2 px-4 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-sm shadow-lg">
                {w.day} • {w.time}
              </p>

              {/* 🔥 VENUE (UPDATED) */}
              <p className="inline-block mt-3 px-3 py-1 rounded-full bg-blue-600/80 text-white font-semibold text-xs shadow-md">
                📍 {w.venue}
              </p>

              <div className="flex gap-4 mt-4 animate-pulse">
                {Object.entries(c).map(([k,v])=>(
                  <div key={k} className="text-center">
                    <div className="text-xl font-bold drop-shadow-[0_0_10px_white]">{v}</div>
                    <span className="text-xs uppercase tracking-wide">{k}</span>
                  </div>
                ))}
              </div>

            </div>
          );
        })}
      </div>

      {/* SEMESTER */}
      <h2 className="text-3xl font-extrabold mb-6 tracking-wide">Semester Activities</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {filteredSemester.map(a => {
          const date = new Date(a.datetime);
          const c = getCountdown(date, now);

          return (
            <div key={a.id} className="p-6 bg-white/10 rounded-2xl backdrop-blur-lg shadow-xl hover:scale-105 transition">

              <img
                src={semesterImages[a.title] || "https://images.unsplash.com/photo-1507692049790-de58290a4334"}
                className="h-32 w-full object-cover rounded mb-3"
              />

              <h3 className="text-lg font-bold tracking-wide">{a.title}</h3>

              {/* DATE */}
              <p className="inline-block mt-2 px-3 py-1 rounded-full bg-black/60 text-cyan-300 font-semibold text-sm shadow-md">
                {date.toLocaleString()}
              </p>

              {/* 🔥 VENUE (UPDATED) */}
              <p className="inline-block mt-3 px-3 py-1 rounded-full bg-purple-600/80 text-white font-semibold text-xs shadow-md">
                📍 {a.venue}
              </p>

              <div className="flex gap-4 mt-4 animate-pulse">
                {Object.entries(c).map(([k,v])=>(
                  <div key={k} className="text-center">
                    <div className="text-xl font-bold drop-shadow-[0_0_10px_white]">{v}</div>
                    <span className="text-xs uppercase tracking-wide">{k}</span>
                  </div>
                ))}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default Activities;