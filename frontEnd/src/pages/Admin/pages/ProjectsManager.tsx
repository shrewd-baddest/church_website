import { useState } from "react";
import {
  ShoppingBag, Package, Tag, UserCircle, BarChart3, Image, Bell, LayoutGrid, MessageCircle, ShoppingCart, CalendarDays,
  Cross, Shirt, Armchair, Music, ChevronRight, ExternalLink
} from "lucide-react";
import ProductsPanel from "./ProductsPanel";
import OrdersPanel from "./ordersmanager";
import HireRequestsPanel from "./hirerequestsmanager";
import CategoriesPanel from "./CategoryManager";
import CustomersPanel from "./CustomerManager";
import ReportsPanel from "./Reports";
import SliderManager from "./SliderManager";
import CategoryCardManager from "./CategoryCardManager";
import NotificationsPanel from "./NotificationsPanel";
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

const purchaseTabs = [
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "products",      label: "Products",      icon: ShoppingBag },
  { id: "orders",        label: "Orders",        icon: Package },
  { id: "categories",    label: "Categories",    icon: Tag },
  { id: "customers",     label: "Customers",     icon: UserCircle },
  { id: "cards",         label: "Home Cards",    icon: LayoutGrid },
  { id: "sliders",       label: "Slider Images", icon: Image },
  { id: "testimonials",  label: "Testimonials",  icon: MessageCircle },
  { id: "reports",       label: "Reports",       icon: BarChart3 },
] as const;

const hireTabs = [
  { id: "hire-products",  label: "Products",      icon: ShoppingBag },
  { id: "hire-requests",  label: "Hire Requests",  icon: CalendarDays },
  { id: "hire-settings",  label: "Hire Settings",  icon: BarChart3 },
  { id: "hire-categories", label: "Categories",    icon: Tag },
  { id: "hire-cards",     label: "Home Cards",    icon: LayoutGrid },
  { id: "hire-sliders",   label: "Slider Images", icon: Image },
  { id: "hire-customers", label: "Customers",     icon: UserCircle },
  { id: "hire-testimonials", label: "Testimonials", icon: MessageCircle },
  { id: "hire-reports",     label: "Reports",       icon: BarChart3 },
] as const;

type SectionId = typeof sections[number]["id"];

export default function ProjectsManager() {
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const [activeTab, setActiveTab] = useState("notifications");
  const currentTabs = activeSection === 'purchase' ? purchaseTabs : hireTabs;

  const handleSectionChange = (sectionId: SectionId) => {
    setActiveSection(prev => prev === sectionId ? null : sectionId);
    setActiveTab(sectionId === 'purchase' ? 'notifications' : 'hire-requests');
  };

  const sectionImages: Record<string, string> = {
    purchase: "https://images.unsplash.com/photo-1606768666853-403c90a981ad?auto=format&fit=crop&q=80&w=600",
    hire: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600",
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800">Projects Manager</h2>
        <p className="text-slate-500 text-sm mt-1">Manage church products, categories, orders, and content.</p>
      </div>

      {/* Section Cards */}
      {!activeSection && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map(section => {
            const details = sectionDetails[section.id];
            return (
              <button
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden flex flex-col group text-left"
              >
                {/* Image Banner */}
                <div className="h-44 w-full overflow-hidden relative bg-slate-100">
                  <img
                    src={sectionImages[section.id]}
                    alt={section.label}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white">
                        <section.icon size={20} />
                      </div>
                      <div className="text-white">
                        <div className="font-black text-lg">{section.label}</div>
                        <div className="text-xs text-white/80 font-medium">{section.tagline}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subcategories */}
                <div className="p-5 flex-1">
                  <div className="flex gap-4">
                    {details.subcategories.map(sub => {
                      const colorClasses: Record<string, string> = {
                        blue: 'bg-blue-100 text-blue-600',
                        amber: 'bg-amber-100 text-amber-600',
                        sky: 'bg-sky-100 text-sky-600',
                        indigo: 'bg-indigo-100 text-indigo-600',
                      };
                      return (
                        <div key={sub.name} className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-xl ${colorClasses[sub.color] || 'bg-slate-100 text-slate-600'} flex items-center justify-center`}>
                            <sub.icon size={18} />
                          </div>
                          <span className="text-sm font-bold text-slate-700">{sub.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {section.id === 'purchase' ? `${purchaseTabs.length} management tabs` : `${hireTabs.length} management tabs`}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:gap-2 transition-all">
                    Open Section <ChevronRight size={14} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Section Panel */}
      {activeSection && (
        <>
          {/* Section Navigation Header */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50"
            >
              <ChevronRight size={16} className="rotate-180" />
              All Sections
            </button>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${activeSection === 'purchase' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                {activeSection === 'purchase' ? <ShoppingCart size={16} /> : <CalendarDays size={16} />}
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-slate-800 block">{activeSection === 'purchase' ? 'Purchase' : 'Hire'}</span>
                <span className="text-[11px] text-slate-400 font-medium">{activeSection === 'purchase' ? 'Sacramentals & T-Shirts' : 'Chairs & Instruments'}</span>
              </div>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-2">
            {currentTabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            {activeSection === 'purchase' && (
              <>
                {activeTab === "notifications" && <NotificationsPanel />}
                {activeTab === "products" && <ProductsPanel categoryFilter={['sacramentals', 'tshirts']} />}
                {activeTab === "orders" && <OrdersPanel />}
                {activeTab === "categories" && <CategoriesPanel typeFilter="sale" />}
                {activeTab === "customers" && <CustomersPanel />}
                {activeTab === "cards" && <CategoryCardManager sectionFilter={['sacramentals', 'tshirts']} />}
                {activeTab === "sliders" && <SliderManager sectionFilter={['sacramentals', 'tshirts']} />}
                {activeTab === "testimonials" && <TestimonialManager />}
                {activeTab === "reports" && <ReportsPanel typeFilter="sale" />}
              </>
            )}

            {activeSection === 'hire' && (
              <>
                {activeTab === "hire-products" && <ProductsPanel categoryFilter={['chairs', 'instruments']} />}
                {activeTab === "hire-requests" && <HireRequestsPanel />}
                {activeTab === "hire-settings" && <HireSettingsSection />}
                {activeTab === "hire-categories" && <CategoriesPanel typeFilter="hire" />}
                {activeTab === "hire-cards" && <CategoryCardManager sectionFilter={['chairs', 'instruments']} />}
                {activeTab === "hire-sliders" && <SliderManager sectionFilter={['chairs', 'instruments']} />}
                {activeTab === "hire-customers" && <CustomersPanel />}
                {activeTab === "hire-testimonials" && <TestimonialManager />}
                {activeTab === "hire-reports" && <ReportsPanel typeFilter="hire" />}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
