import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { FaBell } from "react-icons/fa";
import { publicNavLinks, authNavLinks } from "./headerRoutes";
// Assuming AdminPanel is needed, linking to its original location
import AdminPanel from "../pages/Landing/components/AdminPanel";

const Headers = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [showAdmin, setShowAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [animateBadge, setAnimateBadge] = useState(false);

  // Trigger animation when unread count increases
  useEffect(() => {
    if (unreadCount > 0) {
      setAnimateBadge(true);
      const timer = setTimeout(() => setAnimateBadge(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Merge public + auth-only routes based on login state
  const navLinks = [
    ...publicNavLinks,
    ...(user ? authNavLinks : []),
  ];

  return (
    <>
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 px-[8%] py-3 flex justify-between items-center">
        {/* Logo Section */}
        <div
          className="text-2xl font-bold text-blue-700 tracking-tight cursor-pointer"
          onClick={() => navigate("/")}
        >
          CSA Kirinyaga
        </div>

        {/* Desktop Navigation Links */}
        <ul className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <li key={link.path}>
              {link.path.includes("#") ? (
                <a
                  href={link.path}
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors text-sm whitespace-nowrap"
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  to={link.path}
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors text-sm whitespace-nowrap"
                >
                  {link.name}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <div className="flex items-center space-x-4">
          <div 
            className="relative cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={() => navigate("/Notification")}
          >
            <FaBell className={`text-xl ${unreadCount > 0 ? 'text-blue-600' : 'text-gray-500'}`} />
            {unreadCount > 0 && (
              <span className={`absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-sm flex items-center justify-center min-w-[16px] h-[16px] ${animateBadge ? 'animate-bounce' : ''}`}>
                {unreadCount}
              </span>
            )}
          </div>

          {user ? (
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm font-semibold text-gray-700">
                Hi, {user?.name}
              </span>
              {user.role.includes("admin") && (
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors text-xs"
                  onClick={() => navigate("/admin")}
                >
                  Admin
                </button>
              )}
              {/* Developer Bypass: Allows opening Admin Panel without login in DEV mode */}
              {import.meta.env.DEV && !user.role.includes("admin") && (
                <button
                  className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1.5 rounded-lg font-bold transition-colors text-xs border border-amber-200"
                  onClick={() => navigate("/admin")}
                >
                  Dev Admin
                </button>
              )}
              <button
                className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-semibold transition-colors text-xs"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
               {/* Developer Bypass for Guests */}
              {import.meta.env.DEV && (
                <button
                  className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1.5 rounded-lg font-bold transition-colors text-xs border border-amber-200"
                  onClick={() => navigate("/admin")}
                >
                  Dev Admin
                </button>
              )}
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full font-bold shadow-sm transition-all text-sm"
                onClick={() => navigate("/login")}
              >
                Log In
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            className="md:hidden text-gray-600 hover:text-blue-600 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <div 
        className={`fixed inset-0 z-[100] md:hidden transition-all duration-500 overflow-hidden ${
          isMobileMenuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        {/* Backdrop / Overlay */}
        <div 
          className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Drawer Content */}
        <div 
          className={`absolute top-0 right-0 w-[80%] max-w-[320px] h-full bg-white shadow-2xl transition-transform duration-500 transform ease-out ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-50 bg-gray-50/30">
            <span className="text-xl font-bold text-blue-700">Menu</span>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-white rounded-full transition-colors text-gray-500 shadow-sm border border-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto h-[calc(100%-80px)] custom-scrollbar">
            <ul className="p-6 space-y-1">
              {navLinks.map((link, idx) => (
                <li 
                  key={link.path} 
                  className="transform transition-all duration-300"
                  style={{ 
                    transitionDelay: `${idx * 50}ms`,
                    transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(20px)',
                    opacity: isMobileMenuOpen ? 1 : 0
                  }}
                >
                  {link.path.includes("#") ? (
                    <a
                      href={link.path}
                      className="flex items-center group py-3.5 px-4 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-bold transition-all"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-200 group-hover:bg-blue-500 transition-all mr-3"></span>
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      to={link.path}
                      className="flex items-center group py-3.5 px-4 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-bold transition-all"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-200 group-hover:bg-blue-500 transition-all mr-3"></span>
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
              
              <li className="pt-6 mt-6 border-t border-gray-100 flex flex-col gap-4">
                <button
                  className="flex items-center justify-between w-full py-3.5 px-4 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-bold transition-all bg-gray-50/50"
                  onClick={() => { navigate("/Notification"); setIsMobileMenuOpen(false); }}
                >
                  <div className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-200 mr-3"></span>
                    Notifications
                  </div>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg pulse-animation">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {user ? (
                  <div className="space-y-4 px-2">
                    <div className="flex items-center gap-3 py-2">
                       <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black">
                          {user.name.charAt(0)}
                       </div>
                       <div className="text-sm">
                          <p className="text-gray-400 font-medium">Signed in as</p>
                          <p className="font-bold text-gray-900">{user.name}</p>
                       </div>
                    </div>
                      <button
                        className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold shadow-xl active:scale-[0.98] transition-all"
                        onClick={() => { navigate("/admin"); setIsMobileMenuOpen(false); }}
                      >
                        Admin Dashboard
                      </button>
                    {/* {user.role.includes("admin") && (
                    )} */}
                    <button
                      className="w-full bg-red-50 text-red-600 py-3.5 rounded-xl font-bold hover:bg-red-100 transition-all"
                      onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                    >
                      Log Out
                    </button>
                  </div>
                ) : (
                  <button
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-black shadow-xl shadow-blue-200 active:scale-[0.98] transition-all mt-4"
                    onClick={() => { navigate("/login"); setIsMobileMenuOpen(false); }}
                  >
                    Get Started / Log In
                  </button>
                )}
              </li>
            </ul>
            
            {/* Minimal Footer inside Menu */}
            <div className="p-6 pt-0 text-center">
               <p className="text-[10px] text-gray-300 uppercase tracking-widest font-black italic">CSA Kirinyaga • 2026</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Headers;
