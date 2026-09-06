import { useState } from "react";
import ProductsPanel from "./ProductsPanel";
import OrdersPanel from "./ordersmanager";
import { Shirt, Package } from "lucide-react";

const TABS = [
  { id: "products", label: "T-Shirt Products", icon: Shirt },
  { id: "orders", label: "T-Shirt Orders", icon: Package },
] as const;

export default function TshirtsOnlyAdmin() {
  const [tab, setTab] = useState<"products" | "orders">("products");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">T-Shirts Management</h2>
        <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-xs">
          Manage t-shirt products and orders
        </p>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
              tab === t.id
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-100 p-6">
        {tab === "products" && <ProductsPanel categoryFilter={["tshirts"]} />}
        {tab === "orders" && <OrdersPanel typeFilter="sale" />}
      </div>
    </div>
  );
}
