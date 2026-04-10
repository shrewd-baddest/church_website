import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import AdminPanel from "../AdminPanel";
import { useAuth } from "../../../../context/AuthContext";

function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAdmin, setShowAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Community", path: "/community" },
    { name: "Jumuiya", path: "/jumuiya" },
    { name: "Officials", path: "/officials" },
    ...(user ? [
      { name: "Projects", path: "/#projects" },
      { name: "Activities", path: "/#activities" },
    ] : []),
    { name: "Gallery", path: "/#gallery" },
    { name: "Devotion", path: "/devotions" },
  ];

  return (
    <>
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 px-4 py-3 flex justify-between items-center">
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
                  className={`font-medium transition-colors text-sm whitespace-nowrap pb-1 ${
                    location.pathname === link.path 
                      ? "text-blue-600 border-b-2 border-blue-600" 
                      : "text-gray-600 hover:text-blue-600"
                  }`}
                >
                  {link.name}
                </Link>
              )}
            </li>
          ))}
        </ul>

        {/* User Actions & Mobile Menu Toggle */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm font-semibold text-gray-700">
                Hi, {user.username}
              </span>
              {user.role === "admin" && (
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors text-xs"
                  onClick={() => navigate("/admin")}
                >
                  Admin
                </button>
              )}
              {/* Developer Bypass: Allows opening Admin Panel without login in DEV mode */}
              {import.meta.env.DEV && user?.role !== "admin" && (
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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg animate-in slide-in-from-top duration-300">
          <ul className="py-4 px-4 space-y-2">
            {navLinks.map((link) => (
              <li key={link.path}>
                {link.path.includes("#") ? (
                  <a
                    href={link.path}
                    className="block py-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    to={link.path}
                    className={`block py-2 font-medium transition-colors ${
                      location.pathname === link.path ? "text-blue-600 bg-blue-50 px-3 rounded-lg" : "text-gray-600 hover:text-blue-600"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                )}
              </li>
            ))}
            <li className="pt-4 border-t border-gray-50">
              {user ? (
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-700">Welcome, {user.username}</div>
                  {user.role === "admin" && (
                    <button
                      className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold"
                      onClick={() => { navigate("/admin"); setIsMobileMenuOpen(false); }}
                    >
                      Admin Panel
                    </button>
                  )}
                  <button
                    className="w-full bg-red-50 text-red-600 py-2 rounded-lg font-semibold"
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <button
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold"
                  onClick={() => { navigate("/login"); setIsMobileMenuOpen(false); }}
                >
                  Log In
                </button>
              )}
            </li>
          </ul>
        </div>
      )}
    </>
  );
}

export default Navigation;
