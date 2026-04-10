import { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Heart, 
  BookOpen, 
  Database, 
  Settings, 
  Menu, 
  X,
  ChevronRight,
  LogOut,
  Bell,
  MessageSquare
} from 'lucide-react';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown, { type Notification } from './components/NotificationDropdown';
import apiService from '../Landing/services/api';
import { useEffect } from 'react';
import { timeAgo } from '../../utils';

const menuItems = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { id: 'officials', name: 'Officials Management', icon: Users, path: '/admin/officials-hub' },
  { id: 'donations', name: 'Donation Monitor', icon: Heart, path: '/admin/donations' },
  { id: 'devotions', name: 'Devotions & AI', icon: BookOpen, path: '/admin/devotions-hub' },
  { id: 'suggestions', name: 'User Suggestions', icon: MessageSquare, path: '/admin/suggestions' },
  { id: 'records', name: 'Records Explorer', icon: Database, path: '/admin/records' },
  { id: 'settings', name: 'Settings', icon: Settings, path: '/admin/settings' },
];

export default function UniversalAdmin() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [suggestions, donations] = await Promise.all([
        apiService.fetchTableData('suggestions'),
        apiService.fetchTableData('mpesa_request')
      ]);

      const formattedSuggestions: Notification[] = suggestions.map((s: any) => ({
        id: `s-${s.id}`,
        type: 'suggestion',
        title: 'New Suggestion',
        message: `${s.name || 'Someone'} sent a new suggestion: "${s.suggestion}"`,
        time: timeAgo(s.created_at),
        rawDate: s.created_at,
        isRead: false,
        link: '/admin/suggestions'
      }));

      const formattedDonations: Notification[] = donations
        .filter((d: any) => d.status === 'paid')
        .map((d: any) => ({
          id: `d-${d.id}`,
          type: 'donation',
          title: 'New Donation',
          message: `Received KES ${Number(d.amount).toLocaleString()} from ${d.user_id}`,
          time: timeAgo(d.created_at),
          rawDate: d.created_at,
          isRead: false,
          link: '/admin/donations'
        }));

      // Combine and sort by date descending
      const combined = [...formattedSuggestions, ...formattedDonations]
        .sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime())
        .slice(0, 10);
      
      setNotifications(combined);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleClearAll = () => {
    setNotifications([]);
    setIsNotificationsOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-72' : 'w-20'
        } bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out flex flex-col z-50`}
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800 shrink-0">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          {isSidebarOpen && (
            <div className="ml-4 overflow-hidden">
              <h1 className="text-white font-bold truncate">CSA KIRINYAGA</h1>
              <p className="text-xs text-slate-500 truncate">Admin Command Center</p>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.id === 'dashboard' && location.pathname === '/admin');
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center group transition-all duration-200 px-4 py-3 rounded-xl ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={22} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} />
                {isSidebarOpen && (
                  <div className="ml-4 flex-1 flex items-center justify-between">
                    <span className="font-semibold text-sm">{item.name}</span>
                    {isActive && <ChevronRight size={16} />}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-200"
          >
            <LogOut size={22} />
            {isSidebarOpen && <span className="ml-4 font-semibold text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden"
          >
            <Menu size={24} />
          </button>

          <div className="flex-1 hidden md:block">
            <div className="relative max-w-md">
                   <h2 className='text-slate-800 font-bold text-lg'>Welcome back, {user?.username || 'Admin'}</h2>
                   <p className='text-xs text-slate-500'>Here's what's happening with the church today.</p>
            </div>
          </div>

          <div className="flex items-center gap-6 relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`relative p-2 transition-colors ${isNotificationsOpen ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}
            >
              <Bell size={22} />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
              )}
            </button>

            {isNotificationsOpen && (
              <NotificationDropdown 
                notifications={notifications}
                onClose={() => setIsNotificationsOpen(false)}
                onMarkAsRead={handleMarkAsRead}
                onClearAll={handleClearAll}
              />
            )}
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{user?.username}</p>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{user?.role || 'Administrator'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} alt="avatar" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
