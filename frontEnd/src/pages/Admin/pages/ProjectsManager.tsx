import { useState, useEffect } from "react";
import {
  ShoppingBag, Package, Tag, UserCircle, BarChart3, Image, LayoutGrid, MessageCircle, ShoppingCart, CalendarDays,
  Cross, Shirt, Armchair, Music, ChevronRight, ChevronLeft, Clock, Activity, LogOut, LayoutDashboard,
  HelpCircle, Menu
} from "lucide-react";
import { toast } from 'react-hot-toast';
import { apiClient } from "../../../api/axiosInstance";
import { useAuth } from "../../../context/AuthContext";
import ProductsPanel from "./ProductsPanel";
import OrdersPanel from "./ordersmanager";
import HireRequestsPanel from "./hirerequestsmanager";
import CategoriesPanel from "./CategoryManager";
import CustomersPanel from "./CustomerManager";
import ReportsPanel from "./Reports";
import SliderManager from "./SliderManager";
import CategoryCardManager from "./CategoryCardManager";
import HireSettingsSection from "./HireSettingsSection";
import TestimonialManager from "./TestimonialManager";

const sections = [
  { id: 'purchase', label: 'Purchase', icon: ShoppingCart, tagline: 'Sacramentals & T-Shirts' },
  { id: 'hire',     label: 'Hire',     icon: CalendarDays, tagline: 'Chairs & Instruments' },
] as const;

const sectionDetails: Record<string, { subcategories: { name: string, icon: any, color: string }[] }> = {
  purchase: {
    subcategories: [
      { name: 'Sacramentals', icon: Cross, color: 'blue' },
      { name: 'T-Shirts', icon: Shirt, color: 'amber' },
    ],
  },
  hire: {
    subcategories: [
      { name: 'Chairs', icon: Armchair, color: 'sky' },
      { name: 'Instruments', icon: Music, color: 'indigo' },
    ],
  },
};

interface SidebarItem { id: string; label: string; icon: any }

const purchaseNav: SidebarItem[] = [
  { id: "dashboard",    label: "Dashboard",   icon: LayoutDashboard },
  { id: "orders",       label: "Orders",      icon: Package },
  { id: "products",     label: "Products",    icon: ShoppingBag },
  { id: "categories",   label: "Categories",  icon: Tag },
  { id: "customers",    label: "Customers",   icon: UserCircle },
  { id: "cards",        label: "Home Cards",  icon: LayoutGrid },
  { id: "sliders",      label: "Slider",      icon: Image },
  { id: "testimonials", label: "Testimonials",icon: MessageCircle },
  { id: "reports",      label: "Reports",     icon: BarChart3 },
];

const hireNav: SidebarItem[] = [
  { id: "dashboard",       label: "Dashboard",      icon: LayoutDashboard },
  { id: "hire-requests",   label: "Hire Requests",  icon: CalendarDays },
  { id: "hire-products",   label: "Products",       icon: ShoppingBag },
  { id: "hire-categories", label: "Categories",     icon: Tag },
  { id: "hire-cards",      label: "Home Cards",     icon: LayoutGrid },
  { id: "hire-sliders",    label: "Slider",         icon: Image },
  { id: "hire-customers",  label: "Customers",      icon: UserCircle },
  { id: "hire-testimonials", label: "Testimonials", icon: MessageCircle },
  { id: "hire-settings",   label: "Contact Nos",    icon: HelpCircle },
  { id: "hire-reports",    label: "Reports",        icon: BarChart3 },
];

type SectionId = typeof sections[number]["id"];

export default function ProjectsManager() {
  const { user } = useAuth();
  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role].filter(Boolean);
  const readOnly = userRoles.some((r: any) => r === 'csa_vice_chair');

  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [pendingCount, setPendingCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ products: 0, orders: 0, customers: 0, categories: 0 });
  const [testimonialStats, setTestimonialStats] = useState({ pending: 0, total: 0, avgRating: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [navLoading, setNavLoading] = useState(false);
  const currentNav = activeSection === 'purchase' ? purchaseNav : hireNav;

  const fetchData = async (section: SectionId) => {
    try {
      const isHire = section === 'hire';
      const [ordersRes, productsRes, categoriesRes, testimonialsRes] = await Promise.all([
        apiClient.get('/orders' + (isHire ? '?type=hire' : '')),
        apiClient.get('/products'),
        apiClient.get('/categories'),
        apiClient.get('/testimonials'),
      ]);
      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.data || []);
      const products = Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data?.data || []);
      const categories = Array.isArray(categoriesRes.data) ? categoriesRes.data : (categoriesRes.data?.data || []);
      const testimonials = Array.isArray(testimonialsRes.data) ? testimonialsRes.data : (testimonialsRes.data?.data || []);
      setPendingCount(orders.filter((o: any) => (o.status || '').toLowerCase() === 'pending').length);
      setRecentOrders(orders.slice(0, 8));
      const uniquePhones = new Set(orders.map((o: any) => o.phone || o.customer_phone || o.phone_number).filter(Boolean));
      setStats({
        orders: orders.length,
        products: products.filter((p: any) => isHire ? ['chairs', 'instruments'].includes(p.category) : ['sacramentals', 'tshirts'].includes(p.category)).length,
        customers: uniquePhones.size,
        categories: categories.filter((c: any) => c.type === (isHire ? 'hire' : 'sale')).length,
      });
      const approved = testimonials.filter((t: any) => t.approved);
      setTestimonialStats({
        pending: testimonials.filter((t: any) => !t.approved).length,
        total: testimonials.length,
        avgRating: approved.length > 0 ? Math.round(approved.reduce((s: number, t: any) => s + (t.rating || 0), 0) / approved.length * 10) / 10 : 0,
      });
    } catch { toast.error('Failed to load dashboard data'); }
  };

  const handleNavChange = (id: string) => {
    setNavLoading(true);
    setActiveNav(id);
    setTimeout(() => setNavLoading(false), 400);
  };

  const handleSectionChange = (id: SectionId) => {
    setActiveSection(id);
    setNavLoading(true);
    setTimeout(() => setNavLoading(false), 400);
  };

  useEffect(() => {
    if (activeSection) { fetchData(activeSection); setActiveNav("dashboard"); setSidebarOpen(true); }
  }, [activeSection]);

  useEffect(() => {
    if (!activeSection) return;
    const interval = setInterval(() => fetchData(activeSection!), 15000);
    return () => clearInterval(interval);
  }, [activeSection]);

  const statusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'paid': case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'cancelled': return 'bg-rose-100 text-rose-600';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const sectionImages: Record<string, string> = {
    purchase: "https://images.unsplash.com/photo-1606768666853-403c90a981ad?auto=format&fit=crop&q=80&w=600",
    hire: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600",
  };

  // === Initial Section Selection ===
  if (!activeSection) {
    return (
      <div className="animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Projects Manager</h2>
            <p className="text-slate-800 text-sm mt-0.5">Manage church products, categories, orders, and content.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sections.map(section => {
            const details = sectionDetails[section.id];
            return (
              <button key={section.id} onClick={() => handleSectionChange(section.id)} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden flex flex-col group text-left hover:-translate-y-0.5">
                <div className="h-48 w-full overflow-hidden relative bg-slate-100">
                  <img src={sectionImages[section.id]} alt={section.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                </div>
                <div className="p-5 flex-grow flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <section.icon size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-black text-slate-800 group-hover:text-blue-600 transition-colors">{section.label}</h3>
                      <p className="text-xs text-slate-800 font-medium">{section.tagline}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {details.subcategories.map(sub => {
                      const cls: Record<string, string> = { blue: 'bg-blue-100 text-blue-600', amber: 'bg-amber-100 text-amber-600', sky: 'bg-sky-100 text-sky-600', indigo: 'bg-indigo-100 text-indigo-600' };
                      return <span key={sub.name} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${cls[sub.color] || 'bg-slate-100 text-slate-800'}`}><sub.icon size={14} /> {sub.name}</span>;
                    })}
                  </div>
                </div>
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Open Dashboard</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:gap-2 transition-all">Enter <ChevronRight size={14} /></span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // === Dashboard View (within section) ===
  const renderDashboard = () => {
    const s = activeSection;
    const statsData = [
      { label: 'Products', value: stats.products, icon: ShoppingBag, color: 'bg-blue-500' },
      { label: 'Orders', value: stats.orders, icon: Package, color: 'bg-emerald-500' },
      { label: 'Pending', value: pendingCount, icon: Clock, color: 'bg-amber-500' },
      { label: 'Customers', value: stats.customers, icon: UserCircle, color: 'bg-purple-500' },
      { label: 'Categories', value: stats.categories, icon: Tag, color: 'bg-sky-500' },
      { label: 'Avg Rating', value: testimonialStats.avgRating > 0 ? `${testimonialStats.avgRating}` : '—', icon: MessageCircle, color: 'bg-rose-500' },
    ];

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {statsData.map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">{stat.label}</span>
                <div className={`${stat.color} w-7 h-7 rounded-lg flex items-center justify-center text-white`}><stat.icon size={13} /></div>
              </div>
              <p className="text-2xl font-black text-slate-800">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Package size={14} className="text-blue-600" /> Recent Orders
              </h3>
              <button onClick={() => handleNavChange(s === 'purchase' ? 'orders' : 'hire-requests')} className="text-[11px] font-bold text-blue-600 hover:text-blue-700">View All →</button>
            </div>
            <div className="divide-y divide-slate-100">
              {recentOrders.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-800">No orders yet</div>
              ) : (
                recentOrders.slice(0, 5).map((order: any, i: number) => (
                  <div key={order.id || i} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="min-w-0 flex-1 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 font-bold text-[10px]">#{i + 1}</div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{order.customer_name || 'Customer'}</p>
                        <p className="text-[10px] text-slate-800 truncate">{order.phone || order.customer_phone || order.phone_number || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold text-slate-800">KES {(Number(order.amount || order.total_cost || 0)).toLocaleString()}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusColor(order.status || order.payment_status)}`}>
                        {order.status || order.payment_status || '—'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <Activity size={14} className="text-blue-600" /> Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {currentNav.filter(n => n.id !== 'dashboard').slice(0, 6).map(action => (
                <button key={action.id} onClick={() => handleNavChange(action.id)} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-800 group-hover:text-blue-600 transition-colors"><action.icon size={14} /></div>
                  <span className="text-[10px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors text-center leading-tight">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // === Section Panel Routing ===
  const renderPanel = () => {
    switch (activeNav) {
      case "dashboard": return renderDashboard();
      case "products": return <ProductsPanel categoryFilter={['sacramentals', 'tshirts']} readOnly={readOnly} />;
      case "orders": return <OrdersPanel typeFilter="sale" readOnly={readOnly} />;
      case "categories": return <CategoriesPanel typeFilter="sale" />;
      case "customers": return <CustomersPanel />;
      case "cards": return <CategoryCardManager sectionFilter={['sacramentals', 'tshirts']} />;
      case "sliders": return <SliderManager sectionFilter={['sacramentals', 'tshirts']} />;
      case "testimonials": return <TestimonialManager />;
      case "reports": return <ReportsPanel typeFilter="sale" />;
      case "hire-products": return <ProductsPanel categoryFilter={['chairs', 'instruments']} readOnly={readOnly} />;
      case "hire-requests": return <HireRequestsPanel />;
      case "hire-settings": return <HireSettingsSection />;
      case "hire-categories": return <CategoriesPanel typeFilter="hire" />;
      case "hire-cards": return <CategoryCardManager sectionFilter={['chairs', 'instruments']} />;
      case "hire-sliders": return <SliderManager sectionFilter={['chairs', 'instruments']} />;
      case "hire-customers": return <CustomersPanel />;
      case "hire-testimonials": return <TestimonialManager />;
      case "hire-reports": return <ReportsPanel typeFilter="hire" />;
      default: return renderDashboard();
    }
  };

  return (
    <div className="flex gap-0 min-h-[calc(100vh-6rem)] animate-in fade-in duration-500">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 lg:top-0 z-30 h-full lg:h-auto bg-white border-r border-slate-200 shadow-sm transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-56 left-0' : 'w-0 -left-full lg:w-14 lg:left-0 overflow-hidden'}`}>
        {/* Sidebar Header */}
        <div className="px-4 py-4 border-b border-slate-100">
          <button onClick={() => setActiveSection(null)} className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-slate-800 transition-colors mb-3">
            <ChevronLeft size={14} /> Back
          </button>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${activeSection === 'purchase' ? 'bg-blue-600' : 'bg-purple-600'}`}>
              {activeSection === 'purchase' ? <ShoppingCart size={15} /> : <CalendarDays size={15} />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-800 truncate">{activeSection === 'purchase' ? 'Purchase' : 'Hire'}</p>
              <p className="text-[10px] text-slate-800 truncate">{activeSection === 'purchase' ? 'Sacramentals & T-Shirts' : 'Chairs & Instruments'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {currentNav.map(item => {
            const isActive = activeNav === item.id;
            const isOrders = item.id === 'orders';
            const isTestimonials = item.id === 'testimonials' || item.id === 'hire-testimonials';
            return (
              <button
                key={item.id}
                onClick={() => { handleNavChange(item.id); if (window.innerWidth < 1024) setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-800 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <item.icon size={15} className="shrink-0" />
                <span className="truncate flex-1">{item.label}</span>
                {isOrders && pendingCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center shrink-0">{pendingCount > 9 ? '9+' : pendingCount}</span>
                )}
                {isTestimonials && testimonialStats.pending > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[8px] font-black flex items-center justify-center shrink-0">{testimonialStats.pending > 9 ? '9+' : testimonialStats.pending}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-3 py-3 border-t border-slate-100">
          <button onClick={() => { setActiveSection(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 hover:text-rose-500 hover:bg-rose-50 transition-all">
            <LogOut size={14} /> Back to Sections
          </button>
        </div>
      </aside>

      {/* Toggle button (collapsed state) */}
      {!sidebarOpen && (
        <button onClick={() => setSidebarOpen(true)} className="fixed lg:sticky top-20 lg:top-0 z-10 left-0 lg:left-0 w-10 h-10 bg-white border border-slate-200 rounded-r-xl shadow-sm flex items-center justify-center text-slate-800 hover:text-blue-600 transition-colors">
          <Menu size={16} />
        </button>
      )}

      {/* Main Content */}
      <main className={`flex-1 min-w-0 transition-all duration-300 ${sidebarOpen ? 'ml-56 lg:ml-0' : 'ml-0'}`}>
        {/* Top bar on mobile */}
        <div className="lg:hidden flex items-center gap-3 mb-4">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-800">
              <Menu size={15} />
            </button>
          )}
          <div>
            <p className="text-sm font-bold text-slate-800">{activeSection === 'purchase' ? 'Purchase' : 'Hire'} Dashboard</p>
            <p className="text-[10px] text-slate-800">{activeSection === 'purchase' ? 'Sacramentals & T-Shirts' : 'Chairs & Instruments'}</p>
          </div>
        </div>

        <div className={`relative ${activeNav === "dashboard" ? "space-y-5" : "bg-white rounded-2xl border border-slate-200 shadow-sm p-6"}`}>
          {navLoading && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-2xl">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="w-4 h-4 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-xs font-medium text-slate-800">Loading...</span>
              </div>
            </div>
          )}
          {renderPanel()}
        </div>
      </main>
    </div>
  );
}
