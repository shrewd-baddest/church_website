import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-700">CSA Kirinyaga</div>
        <ul className="flex items-center space-x-6">
          {user ? (
            <>
              {/* Logged-in user navigation */}
              <li><Link to="/jumuiya" className="text-gray-600 hover:text-blue-700">Jumuiya</Link></li>
              <li><Link to="/officials" className="text-gray-600 hover:text-blue-700">Officials</Link></li>
              <li><a href="#projects" className="text-gray-600 hover:text-blue-700">Projects</a></li>
              <li><a href="#activities" className="text-gray-600 hover:text-blue-700">Activities</a></li>
              <li><a href="#gallery" className="text-gray-600 hover:text-blue-700">Gallery</a></li>
              <li>
                <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <li><Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Login</Link></li>
          )}

        </ul>
      </nav>
    </header>
  );
};

export default Navbar;