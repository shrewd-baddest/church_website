import React from "react";
import { FaHome, FaInfoCircle, FaUsers ,FaPrayingHands } from "react-icons/fa";

import { FiImage } from "react-icons/fi";
import { HiOutlineMenu, HiOutlineSupport, HiOutlineX } from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";

const Headers = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  return (
    <>
      <div className="hidden flex-row items-center justify-between px-[8%] py-4 bg-white shadow-md md:flex ">
        <div className="flex items-center gap-2">
          <img
            src="../src/assets/Images/church.png"
            alt="CSA Kirinyaga Logo"
            className="h-10 w-10 object-contain"
          />
        </div>

        <ul className="flex flex-row gap-2 lg:gap-8">
          <Link to="/" className="flex flex-row items-center gap-1">
            <FaHome className="w-5 h-5" />
            <li className="font-semibold">Home</li>
          </Link>

          <Link
            to="/jumuia"
            className="flex flex-row items-center gap-1 px-4 py-2"
          >
            <FaInfoCircle className="inline w-5 h-5" />
            <li className="font-semibold">Jumuia</li>
          </Link>

          <Link
            to="/officials"
            className="flex flex-row items-center gap-1 px-4 py-2"
          >
            <FaUsers className="w-5 h-5" />
            <li className="font-semibold">officials</li>
          </Link>

          <Link
            to="/activities"
            className="flex flex-row items-center gap-1 px-4 py-2"
          >
            <HiOutlineSupport className="w-5 h-5" />
            <li className="font-semibold">Activities</li>
          </Link>

          <Link
            to="/gallery"
            className="flex flex-row items-center gap-1 px-4 py-2"
          >
            <FiImage className="w-5 h-5" />
            <li className="font-semibold">Gallery</li>
          </Link>

          <Link
            to="/devotions"
            className="flex flex-row items-center gap-1 px-4 py-2"
          >
            <FaPrayingHands className="w-5 h-5" />
            <li className="font-semibold">Devotions</li>
          </Link>
        </ul>
        <section>
          <button
            className="px-5 py-1 text-white transition duration-200 bg-blue-600 rounded-md hover:bg-blue-700"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </section>
      </div>

      <div className="flex flex-row items-center justify-between px-[8%] py-4 bg-white shadow-md md:hidden">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-gray-600 focus:outline-none"
        >
          <HiOutlineMenu
            className={`w-6 h-6 ${!isMenuOpen ? "block" : "hidden"}`}
          />
          <HiOutlineX
            className={`w-6 h-6 ${isMenuOpen ? "block" : "hidden"}`}
          />
        </button>
        <div>
          {isMenuOpen && (
            <ul className="absolute left-0 flex flex-col items-center w-full gap-4 py-4 transition duration-500 bg-white shadow-md top-16">
              <section>
                <img src="" alt="" />
                <h1 className="text-xl font-bold text-blue-600">
                  CSA Kirinyaga
                </h1>
              </section>
              <Link
                to="/"
                className="flex flex-row items-center gap-1 px-4 py-2"
              >
                <FaHome className="w-5 h-5" />
                <li className="font-semibold">Home</li>
              </Link>
              <Link
                to="/jumuia"
                className="flex flex-row items-center gap-1 px-4 py-2"
              >
                <FaInfoCircle className="inline w-5 h-5" />
                <li className="font-semibold">Jumuia</li>
              </Link>
              <Link
                to="/officials"
                className="flex flex-row items-center gap-1 px-4 py-2"
              >
                <FaUsers className="w-5 h-5" />
                <li className="font-semibold">officials</li>
              </Link>
              <Link
                to="/activities"
                className="flex flex-row items-center gap-1 px-4 py-2"
              >
                <HiOutlineSupport className="w-5 h-5" />
                <li className="font-semibold">Activities</li>
              </Link>
              <Link
                to="/gallery"
                className="flex flex-row items-center gap-1 px-4 py-2"
              >
                <FiImage className="w-5 h-5" />
                <li className="font-semibold">Gallery</li>
              </Link>

              <Link
                to="/login"
                className="block px-4 py-2 text-center text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Login
              </Link>
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default Headers;
