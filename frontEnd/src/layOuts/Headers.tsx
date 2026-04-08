import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaHome, FaInfoCircle, FaUsers, FaPrayingHands } from "react-icons/fa";
import { FiImage } from "react-icons/fi";
import { HiOutlineMenu, HiOutlineSupport, HiOutlineX } from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";

const Headers: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const navigate = useNavigate();

  const token: string | null = localStorage.getItem("token");

  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);

    return () => window.removeEventListener("storage", checkAuth);
  }, []);
  const handleLogins = async () => {
    try {
      if (isLoggedIn) {
        const response = await axios.post(
          "http://localhost:3001/authentication/v1/log-out",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data === "logged out successfully") {
          localStorage.removeItem("token");
          setIsLoggedIn(false);
          navigate("/");
        } else {
          alert("Failed to log you out");
        }
      } else {
        navigate("/login");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.response?.data);
      } else if (error instanceof Error) {
        console.error("General error:", error.message);
      } else {
        console.error("Unexpected error");
      }
    }
  };

  return (
    <>
      {/* DESKTOP NAV */}
      <div className="hidden md:flex justify-between items-center px-[8%] py-4 bg-white shadow-md">
        <div className="flex items-center gap-2">
          <img
            src="/assets/Images/church.png"
            alt="CSA Kirinyaga Logo"
            className="object-contain w-10 h-10"
          />
        </div>

        <ul className="flex gap-4 lg:gap-8">
          <Link to="/" className="flex items-center gap-1">
            <FaHome />
            <li>Home</li>
          </Link>

          <Link to="/community" className="flex items-center gap-1">
            <FaInfoCircle />
            <li>Community</li>
          </Link>

          <Link to="/jumuiya" className="flex items-center gap-1">
            <FaInfoCircle />
            <li>Jumuiya</li>
          </Link>

          <Link to="/officials" className="flex items-center gap-1">
            <FaUsers />
            <li>Officials</li>
          </Link>

          <Link to="/activities" className="flex items-center gap-1">
            <HiOutlineSupport />
            <li>Activities</li>
          </Link>

          <Link to="/gallery" className="flex items-center gap-1">
            <FiImage />
            <li>Gallery</li>
          </Link>

          <Link to="/devotions" className="flex items-center gap-1">
            <FaPrayingHands />
            <li>Devotions</li>
          </Link>
        </ul>

        <button
          onClick={handleLogins}
          className="px-5 py-1 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          {isLoggedIn ? "Logout" : "Login"}
        </button>
      </div>

      {/* MOBILE NAV */}
      <div className="md:hidden flex justify-between items-center px-[8%] py-4 bg-white shadow-md">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <HiOutlineX /> : <HiOutlineMenu />}
        </button>

        {isMenuOpen && (
          <ul className="absolute left-0 flex flex-col items-center w-full gap-4 py-4 bg-white shadow-md top-16">
            <Link to="/">Home</Link>
            <Link to="/community">Community</Link>
            <Link to="/jumuiya">Jumuiya</Link>
            <Link to="/officials">Officials</Link>
            <Link to="/activities">Activities</Link>
            <Link to="/gallery">Gallery</Link>

            <button
              onClick={handleLogins}
              className="px-4 py-2 text-white bg-blue-600 rounded-md"
            >
              log out
              {/* {isLoggedIn ? "Logout" : "Login"} */}
            </button>
          </ul>
        )}
      </div>
    </>
  );
};

export default Headers;