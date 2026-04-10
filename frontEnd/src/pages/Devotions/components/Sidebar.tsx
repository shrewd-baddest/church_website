import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FaHome,
  FaBook,
  FaPrayingHands,
  FaChurch,
  FaBed,
  FaStar,
} from "react-icons/fa";

// ✅ Your navigation items
const items = [
  { to: "/devotions", label: "Dashboard", icon: <FaHome /> },
  { to: "readings", label: "Scripture", icon: <FaBook /> },
  { to: "prayer", label: "Prayer", icon: <FaPrayingHands /> },
  { to: "liturgy", label: "Liturgy", icon: <FaChurch /> },
  { to: "rosary", label: "Rosary", icon: <FaBed /> },
  { to: "challenge", label: "Daily Challenge", icon: <FaStar /> },
];

// ✅ Carousel content (linked to nav)
const carouselItems = [
  {
    title: "Understand the Mass",
    description: "Explore the liturgy and deepen your understanding.",
    bgStyle: "bg-gradient-to-r from-pink-300 via-pink-200 to-transparent",
    link: "/devotions/liturgy",
  },
  {
    title: "Daily Scripture",
    description: "Read and reflect on daily Bible readings.",
    bgStyle: "bg-gradient-to-r from-purple-300 via-purple-200 to-transparent",
    link: "/devotions/readings",
  },
  {
    title: "Strengthen Prayer",
    description: "Grow your spiritual life through guided prayer.",
    bgStyle: "bg-gradient-to-r from-blue-300 via-blue-200 to-transparent",
    link: "/devotions/prayer",
  },
  {
    title: "Pray the Rosary",
    description: "Follow along and meditate on the mysteries.",
    bgStyle: "bg-gradient-to-r from-yellow-300 via-yellow-200 to-transparent",
    link: "/devotions/rosary",
  },
];


function SidebarCarousel() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  const next = () =>
    setIndex((prev) => (prev + 1) % carouselItems.length);

  const prev = () =>
    setIndex((prev) =>
      prev === 0 ? carouselItems.length - 1 : prev - 1
    );

  useEffect(() => {
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, []);

  const item = carouselItems[index];

  return (
    <div className="mt-6 relative w-[95%] mx-auto group">
      {/* Floating container */}
      <div
        onClick={() => navigate(item.link)}
        className={`h-48 cursor-pointer flex flex-col justify-end p-6 text-gray-800 transition-all duration-500 ${item.bgStyle} relative rounded-2xl`}
        style={{
          boxShadow: "0 30px 60px rgba(0,0,0,0.25)", // far, diffuse shadow
        }}
      >
        {/* Content */}
        <div className="relative z-10 pb-6">
          <h3 className="text-lg italic font-semibold">{item.title}</h3>
          <p className="text-sm italic opacity-80">{item.description}</p>
        </div>

        {/* Controls */}
        <button
          onClick={prev}
          className="absolute left-3 bottom-1 bg-white/70 text-gray-700 rounded-full w-9 h-9 flex items-center justify-center hover:bg-white transition"
        >
          ‹
        </button>

        <button
          onClick={next}
          className="absolute right-3 bottom-1 bg-white/70 text-gray-700 rounded-full w-9 h-9 flex items-center justify-center hover:bg-white transition"
        >
          ›
        </button>

        {/* Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {carouselItems.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-all ${
                i === index ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}




export default function Sidebar() {
  return (
    <>
      {/* ✅ Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-gray-50 h-screen border-r border-gray-200 sticky top-0 left-0 shadow-sm">
        <div className="p-6 flex flex-col h-full">
          {/* Navigation */}
          <nav className="space-y-2">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-300 ${
                    isActive
                      ? "bg-pink-100 text-pink-700 font-semibold shadow-sm"
                      : "text-gray-700 hover:text-pink-600 hover:bg-gray-100"
                  }`
                }
              >
                <span className="text-lg">{it.icon}</span>
                <span className="text-sm">{it.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Carousel */}
          <SidebarCarousel />
        </div>
      </aside>

      {/* ✅ Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 md:hidden flex justify-around py-2 shadow-sm">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center text-xs transition-colors ${
                isActive
                  ? "text-pink-600"
                  : "text-gray-700 hover:text-pink-600"
              }`
            }
          >
            <span className="text-lg">{it.icon}</span>
            <span className="sr-only">{it.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}