import {
  LayoutDashboard,
  Users,
  HandCoins,
  BookOpen,
  Settings,
  Menu,
  ChevronRight,
  ChevronDown,
  LogOut,
  Bell,
  CalendarDays,
  MessageSquare,
  Image as ImageIcon,
  UserPlus,
  ClipboardList,
  Trash2,
  Shield,
  CalendarCheck,
  Code2,
  Activity,
  Megaphone,
  Globe,
  Store,
  MessageCircle,
  Shirt,
  Wallet,
  CalendarCheck2,
  Share2,
  Home,
} from 'lucide-react';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown, { type Notification } from './components/NotificationDropdown';
import apiService from '../../services/api';
import { apiClient } from '../../api/axiosInstance';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { timeAgo } from '../../utils';
import { ArtDeco404 } from './components/ArtDeco404';
import { checkAccess, normalizeRoles } from '../../utils/adminAccess';

interface SubNavItem {
  id: string;
  name: string;
  path: string;
}

interface NavItem {
  id: string;
  name: string;
  icon: React.ElementType;
  path?: string;
  subItems?: SubNavItem[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const menuSections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    ],
  },
  {
    label: 'Engagement',
    items: [
      {
        id: 'activities',
        name: 'Activities',
        icon: CalendarDays,
        subItems: [
          { id: 'weekly-activities', name: 'Weekly Schedule', path: '/admin/weekly-activities' },
          { id: 'semester-activities', name: 'Upcoming Events', path: '/admin/semester-activities' },
        ],
      },
      { id: 'announcements', name: 'Announcements', icon: Megaphone, path: '/admin/announcements' },
      { id: 'community-updates', name: 'Community Updates', icon: Bell, path: '/admin/community-updates' },
      { id: 'gallery', name: 'Gallery', icon: ImageIcon, path: '/admin/gallery' },
      { id: 'suggestions', name: 'Suggestions', icon: MessageSquare, path: '/admin/suggestions' },
      { id: 'suggestion-bin', name: 'Suggestion Bin', icon: Trash2, path: '/admin/suggestion-bin' },
      { id: 'donations', name: 'Donations', icon: HandCoins, path: '/admin/donations' },
      { id: 'treasury', name: 'Treasury', icon: Wallet, path: '/admin/treasury' },
      { id: 'bookings', name: 'Activity Bookings', icon: CalendarCheck2, path: '/admin/bookings' },
    ],
  },
  {
    label: 'Members & Jumuiya',
    items: [
      { id: 'officials', name: 'Officials', icon: Users, path: '/admin/officials' },
      { id: 'community', name: 'Community', icon: Globe, path: '/admin/community-management' },
      { id: 'secretary-dashboard', name: 'My Jumuiya', icon: Shield, path: '/admin/secretary-dashboard' },
      { id: 'jumuiya-members', name: 'Members', icon: UserPlus, path: '/admin/jumuiya-members' },
      { id: 'attendance-tally', name: 'Attendance Tally', icon: CalendarCheck, path: '/admin/attendance-tally' },
      { id: 'registered-members', name: 'Registered Members', icon: ClipboardList, path: '/admin/registered-members' },
      { id: 'jumuiya-tshirts', name: 'Jumuiya T-Shirts', icon: Shirt, path: '/admin/jumuiya-tshirts' },
      { id: 'jumuiya-channels', name: 'Channels', icon: Share2, path: '/admin/jumuiya-channels' },
    ],
  },
  {
    label: 'Store & Devotions',
    items: [
      { id: 'devotions', name: 'Devotions & AI', icon: BookOpen, path: '/admin/devotions' },
      { id: 'projects', name: 'Projects', icon: Store, path: '/admin/projects' },
      { id: 'csa-tshirts', name: 'T-Shirts', icon: Shirt, path: '/admin/csa-tshirts' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'activity-log', name: 'Activity Log', icon: Activity, path: '/admin/activity-log' },
      { id: 'whatsapp-links', name: 'WhatsApp Groups', icon: MessageCircle, path: '/admin/whatsapp-links' },
      { id: 'developers', name: 'Developer Team', icon: Code2, path: '/admin/developers' },
      { id: 'settings', name: 'Settings', icon: Settings, path: '/admin/settings' },
    ],
  },
];

export default function UniversalAdmin() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [openMenus, setOpenMenus] = useState<string[]>(['activities']);

  const navRef = useRef<HTMLElement | null>(null);
  const NAV_SCROLL_KEY = 'admin_nav_scroll';
  const loadSavedNavScroll = (): number => {
    try {
      const saved = Number(sessionStorage.getItem(NAV_SCROLL_KEY));
      return Number.isFinite(saved) && saved > 0 ? saved : 0;
    } catch { return 0; }
  };
  const savedNavScroll = useRef<number>(loadSavedNavScroll());

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  }, []);

  const rememberNavScroll = () => {
    if (navRef.current) savedNavScroll.current = navRef.current.scrollTop;
    try { sessionStorage.setItem(NAV_SCROLL_KEY, String(savedNavScroll.current)); } catch { /* ignore */ }
  };

  const restoreNavScroll = () => {
    const el = navRef.current;
    if (!el) return;
    const prev = el.style.scrollBehavior;
    el.style.scrollBehavior = 'auto';
    el.scrollTop = savedNavScroll.current;
    el.style.scrollBehavior = prev;
  };

  useLayoutEffect(() => {
    restoreNavScroll();
    const frame = requestAnimationFrame(restoreNavScroll);
    const timer = window.setTimeout(restoreNavScroll, 50);
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); };
  }, [location.pathname]);

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
    else setIsSidebarOpen(true);
  }, [isMobile]);

  const closeSidebarIfMobile = () => {
    if (isMobile) setIsSidebarOpen(false);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('admin_last_path', location.pathname);
  }, [location.pathname]);

  const fetchNotifications = async () => {
    try {
      const [suggestionsRes, donations] = await Promise.all([
        apiClient.get('/suggestions', { params: { jumuiya_id: 'csa' } }).catch(() => ({ data: [] })),
        apiService.fetchTableData('mpesa_request')
      ]);

      const suggestionsData = suggestionsRes?.data;
      const suggestions = Array.isArray(suggestionsData?.data)
        ? suggestionsData.data
        : (Array.isArray(suggestionsData) ? suggestionsData : []);

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
          id: `d-${d.checkout_id || Math.random()}`,
          type: 'donation',
          title: 'New Donation',
          message: `Received KES ${Number(d.amount).toLocaleString()} from ${d.user_id}`,
          time: timeAgo(d.created_at),
          rawDate: d.created_at,
          isRead: false,
          link: '/admin/donations'
        }));

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

  const { user, logout } = useAuth();

  const normalized = normalizeRoles(user?.role);

  const hasAccess = checkAccess(normalized, location.pathname);

  const allowedSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.path) return checkAccess(normalized, item.path);
        if (item.subItems) return item.subItems.some((child) => checkAccess(normalized, child.path));
        return false;
      }),
    }))
    .filter((section) => section.items.length > 0);

  const allItems = menuSections.flatMap((s) => s.items);

  const currentPage = (() => {
    if (location.pathname === '/admin') return 'Dashboard';
    for (const item of allItems) {
      if (item.path && location.pathname === item.path) return item.name;
      if (item.subItems) {
        const child = item.subItems.find((c) => location.pathname === c.path);
        if (child) return child.name;
      }
    }
    return 'Admin';
  })();

  const roleLabel = Array.isArray(user?.role)
    ? (user!.role as string[]).join(', ')
    : user?.role || 'Admin';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isItemActive = (item: NavItem) => {
    if (item.path) return location.pathname === item.path;
    return false;
  };

  const isSubActive = (item: NavItem) =>
    item.subItems?.some((child) => location.pathname === child.path) || false;

  return (
    <div className="h-screen bg-slate-50 text-slate-800 flex overflow-hidden font-sans">
      {/* Mobile backdrop */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={closeSidebarIfMobile}
        />
      )}

      <aside
        className={`${isMobile
            ? `fixed inset-y-0 left-0 w-72 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `${isSidebarOpen ? 'w-72' : 'w-[4.5rem]'} transition-all duration-300 ease-in-out`
          } bg-white border-r border-slate-200/90 text-slate-700 flex flex-col z-50 shadow-lg`}
      >
        {/* Brand */}
        <div className="h-[4.25rem] flex items-center gap-3 px-5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 ring-2 ring-blue-100">
            <span className="text-white font-black text-lg tracking-tight">C</span>
          </div>
          {isSidebarOpen && (
            <div className="min-w-0">
              <h1 className="text-slate-900 font-black text-[15px] tracking-wide truncate leading-tight">CSA Kirinyaga</h1>
              <p className="text-[10px] text-slate-500 tracking-[0.18em] uppercase truncate font-bold">Admin Console</p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-slate-200" />

        {/* Navigation */}
        <nav
          ref={navRef}
          onScroll={rememberNavScroll}
          className="flex-1 py-4 px-3 overflow-y-auto no-scrollbar"
        >
          {allowedSections.map((section, sIdx) => (
            <div key={section.label}>
              {isSidebarOpen ? (
                <p className="px-3 mt-5 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {section.label}
                </p>
              ) : (
                sIdx > 0 && <div className="mx-3 my-4 h-px bg-slate-200" />
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  if (!item.subItems) {
                    const active = isItemActive(item);
                    return (
                      <Link
                        key={item.id}
                        to={item.path!}
                        onClick={() => {
                          rememberNavScroll();
                          closeSidebarIfMobile();
                        }}
                        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 group ${
                          active
                            ? 'text-white shadow-md shadow-blue-500/20'
                            : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100/80'
                        }`}
                        style={active
                          ? {
                              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                            }
                          : undefined}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-amber-400" />
                        )}
                        <item.icon
                          size={19}
                          strokeWidth={active ? 2.2 : 1.8}
                          className={active ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'}
                        />
                        {isSidebarOpen && (
                          <span className={`flex-1 truncate leading-tight ${active ? 'font-black' : ''}`}>
                            {item.name}
                          </span>
                        )}
                      </Link>
                    );
                  }

                  const isOpen = openMenus.includes(item.id);
                  const childActive = isSubActive(item);
                  const accent = childActive && !isOpen;

                  return (
                    <div key={item.id} className="flex flex-col">
                      <button
                        onClick={() => {
                          toggleMenu(item.id);
                          if (!isSidebarOpen) setIsSidebarOpen(true);
                        }}
                        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 w-full text-left group ${
                          accent
                            ? 'text-blue-600 bg-blue-50 font-black'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                      >
                        {childActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-amber-400" />
                        )}
                        <item.icon size={19} strokeWidth={1.8} className="shrink-0 text-slate-500 group-hover:text-blue-600" />
                        {isSidebarOpen && (
                          <>
                            <span className={`flex-1 truncate leading-tight ${accent ? 'text-blue-700' : ''}`}>
                              {item.name}
                            </span>
                            {isOpen
                              ? <ChevronDown size={14} className="shrink-0 text-slate-400" />
                              : <ChevronRight size={14} className="shrink-0 text-slate-400" />}
                          </>
                        )}
                      </button>
                      {isSidebarOpen && isOpen && (
                        <div className="ml-[1.35rem] pl-4 border-l border-slate-200 space-y-1 mt-1">
                          {item.subItems.map((child) => {
                            const childActivePath = location.pathname === child.path;
                            return (
                              <Link
                                key={child.id}
                                to={child.path}
                                onClick={() => {
                                  rememberNavScroll();
                                  closeSidebarIfMobile();
                                }}
                                className={`block px-3 py-2 rounded-lg text-[12px] font-bold transition-colors duration-200 ${
                                  childActivePath
                                    ? 'text-blue-700 bg-blue-100/80 font-black shadow-xs'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                              >
                                {child.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Profile + Logout */}
        <div className="p-3 border-t border-slate-200 shrink-0 bg-slate-50/50">
          {isSidebarOpen && (
            <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-black text-sm shrink-0 shadow-xs">
                {user?.name?.[0] ?? 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-extrabold text-slate-900 truncate leading-tight">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-slate-500 font-bold capitalize truncate">{roleLabel}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 group cursor-pointer font-bold text-xs"
          >
            <LogOut size={18} className="shrink-0 text-slate-400 group-hover:text-rose-600" />
            {isSidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        {/* Top Header */}
        <header className="h-16 lg:h-[4.25rem] bg-white/95 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-4 md:px-6 lg:px-8 shrink-0 shadow-xs z-20">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all shadow-xs cursor-pointer"
              aria-label="Toggle sidebar"
            >
              <Menu size={19} />
            </button>

            {/* Home button — mobile only */}
            <Link
              to="/"
              className="sm:hidden w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-all shadow-xs"
              aria-label="Back to site"
            >
              <Home size={18} />
            </Link>

            {/* Breadcrumb */}
            <nav className="hidden sm:flex items-center gap-1.5 text-sm ml-1 min-w-0">
              <Link to="/" className="text-slate-500 hover:text-blue-600 font-semibold whitespace-nowrap">Home</Link>
              <ChevronRight size={14} className="text-slate-300 shrink-0" />
              <Link to="/admin" className="text-slate-500 hover:text-blue-600 font-semibold whitespace-nowrap">Admin</Link>
              <ChevronRight size={14} className="text-slate-300 shrink-0" />
              <span className="font-extrabold text-slate-900 truncate">{currentPage}</span>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Profile */}
            <div className="flex items-center gap-3 pl-1">
              <div className="text-right hidden md:block">
                <p className="text-sm font-extrabold text-slate-900 leading-tight">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-slate-500 font-bold capitalize truncate max-w-[160px]">{roleLabel}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-sm ring-2 ring-slate-100">
                {user?.name?.[0] ?? 'A'}
              </div>
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all text-xs font-bold shadow-xs cursor-pointer"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-3 sm:p-5 lg:p-8 w-full max-w-[1600px] mx-auto">
            {hasAccess ? <Outlet /> : <ArtDeco404 />}
          </div>
        </main>
      </div>
    </div>
  );
}
