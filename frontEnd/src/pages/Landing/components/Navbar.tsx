import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useState } from 'react';
import DonationModal from './DonationModal';
import { Heart } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isDonationOpen, setIsDonationOpen] = useState(false);

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-700">CSA Kirinyaga</div>
        <ul className="flex items-center space-x-6">
          <li>
            <Link 
              to="/" 
              className={`font-medium transition-colors ${location.pathname === "/" ? "text-blue-700 border-b-2 border-blue-700 pb-1" : "text-gray-600 hover:text-blue-700"}`}
            >
              Home
            </Link>
          </li>
          {user ? (
            <>
              <li>
                <Link 
                  to="/jumuiya" 
                  className={`font-medium transition-colors ${location.pathname === "/jumuiya" ? "text-blue-700 border-b-2 border-blue-700 pb-1" : "text-gray-600 hover:text-blue-700"}`}
                >
                  Jumuiya
                </Link>
              </li>
              <li>
                <Link 
                  to="/officials" 
                  className={`font-medium transition-colors ${location.pathname === "/officials" ? "text-blue-700 border-b-2 border-blue-700 pb-1" : "text-gray-600 hover:text-blue-700"}`}
                >
                  Officials
                </Link>
              </li>
              <li>
                <Link 
                  to="/gallery" 
                  className={`font-medium transition-colors ${location.pathname === "/gallery" ? "text-blue-700 border-b-2 border-blue-700 pb-1" : "text-gray-600 hover:text-blue-700"}`}
                >
                  Gallery
                </Link>
              </li>
            </>
          ) : (
            <>
              <li><a href="#about" className="text-gray-600 hover:text-blue-700 font-medium">About</a></li>
              <li><a href="#projects" className="text-gray-600 hover:text-blue-700 font-medium">Projects</a></li>
            </>
          )}
          
          <li>
            <button 
              onClick={() => setIsDonationOpen(true)}
              className="flex items-center gap-2 text-rose-600 hover:text-rose-700 font-bold bg-rose-50 px-4 py-2 rounded-full transition-all border border-rose-100"
            >
              <Heart size={18} fill="currentColor" />
              Donate
            </button>
          </li>

          {user ? (
            <li>
              <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 font-medium">
                Logout
              </button>
            </li>
          ) : (
            <li><Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium">Login</Link></li>
          )}
        </ul>
      </nav>

      <DonationModal isOpen={isDonationOpen} onClose={() => setIsDonationOpen(false)} />
    </header>
  );
};

export default Navbar;