import { useState } from "react";
import {
  ShoppingBag, Package, Tag, UserCircle, BarChart3, Image, Bell, LayoutGrid, MessageCircle, ShoppingCart, CalendarDays
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
  { id: 'purchase', label: 'Purchase (Sacramentals & T-Shirts)', icon: ShoppingCart },
  { id: 'hire',     label: 'Hire (Chairs & Instruments)',       icon: CalendarDays },
] as const;

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
  const [activeSection, setActiveSection] = useState<SectionId>('purchase');
  const [activeTab, setActiveTab] = useState("notifications");
  const currentTabs = activeSection === 'purchase' ? purchaseTabs : hireTabs;

  const handleSectionChange = (sectionId: SectionId) => {
    setActiveSection(sectionId);
    setActiveTab(sectionId === 'purchase' ? 'notifications' : 'hire-requests');
  };

  return (
    <div className="space-y-4">
      {/* Section Switcher */}
      <div className="flex gap-2">
        {sections.map(section => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => handleSectionChange(section.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              <section.icon size={18} />
              {section.label}
            </button>
          );
        })}
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
  );
}
