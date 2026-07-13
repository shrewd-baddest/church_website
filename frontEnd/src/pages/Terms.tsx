import React, { useState } from "react";
import { Scale, FileText, ShoppingBag, Landmark, HeartHandshake, HelpCircle } from "lucide-react";

export default function Terms() {
  const [activeSection, setActiveSection] = useState("agreement");

  const sections = [
    { id: "agreement", title: "1. The Agreement", icon: FileText },
    { id: "conduct", title: "2. Member Conduct", icon: Scale },
    { id: "rentals", title: "3. Merchandise & Rentals", icon: ShoppingBag },
    { id: "donations", title: "4. Donations & Support", icon: Landmark },
    { id: "disclaimers", title: "5. Disclaimers & Liability", icon: HelpCircle },
    { id: "termination", title: "6. Terms & Updates", icon: HeartHandshake },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-24 px-6 sm:px-12 lg:px-24">
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />

      <div className="max-w-7xl mx-auto">
        {/* Header Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-6">
            <Scale className="w-3.5 h-3.5" />
            Terms of Service
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none mb-6">
            Terms &amp; Conditions
          </h1>
          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
            Please read these terms carefully before accessing or using the St. Thomas Aquinas CSA platform.
            These terms define the rules and conditions governing community interactions.
          </p>
          <div className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Last Updated: July 2026
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mt-8">
          
          {/* Left Sidebar Navigation */}
          <aside className="lg:col-span-1 lg:sticky lg:top-28 h-fit space-y-2">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-3">
              Table of Contents
            </h3>
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                      : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{sec.title}</span>
                </button>
              );
            })}
          </aside>

          {/* Right Main Content Area */}
          <div className="lg:col-span-3 space-y-12">
            
            {/* 1. The Agreement */}
            <section
              id="agreement"
              className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  1. The Agreement
                </h2>
              </div>
              <div className="text-slate-600 space-y-4 text-sm sm:text-base leading-relaxed font-medium">
                <p>
                  These Terms and Conditions constitute a legally binding agreement made between you, whether 
                  personally or on behalf of an entity, and St. Thomas Aquinas CSA concerning your access to and use 
                  of our web portal.
                </p>
                <p>
                  By registering an account, booking church assets, purchasing parish materials, or browsing public 
                  parish pages, you confirm that you have read, understood, and agreed to be bound by all of these 
                  terms.
                </p>
              </div>
            </section>

            {/* 2. Member Conduct */}
            <section
              id="conduct"
              className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Scale className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  2. Member Code of Conduct
                </h2>
              </div>
              <div className="text-slate-600 space-y-4 text-sm sm:text-base leading-relaxed font-medium">
                <p>
                  As a platform dedicated to fostering spiritual growth and Christian fellowship, we expect all members 
                  to uphold our core values:
                </p>
                <ul className="space-y-3 pl-4 border-l-2 border-blue-100">
                  <li>
                    <strong className="text-slate-800">Respectful Communication:</strong> All forum discussions, suggestion box 
                    submissions, and chat interactions must remain respectful, charitable, and aligned with Christian ethics.
                  </li>
                  <li>
                    <strong className="text-slate-800">Account Safety:</strong> You are responsible for keeping your login 
                    password secure. Any actions taken from your authenticated account are your responsibility.
                  </li>
                  <li>
                    <strong className="text-slate-800">Prohibited Actions:</strong> Trying to scrape database content, bypassing security 
                    restrictions, or publishing misleading material is strictly prohibited and will lead to account suspension.
                  </li>
                </ul>
              </div>
            </section>

            {/* 3. Merchandise & Rentals */}
            <section
              id="rentals"
              className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  3. Merchandise Purchases &amp; Asset Rentals
                </h2>
              </div>
              <div className="text-slate-600 space-y-4 text-sm sm:text-base leading-relaxed font-medium">
                <p>
                  We coordinate custom merchandise requests (e.g. CSA T-Shirts) and hire services for community assets 
                  (Chairs, Liturgical Instruments):
                </p>
                <ul className="space-y-3 pl-4 border-l-2 border-emerald-100">
                  <li>
                    <strong className="text-slate-800">Orders:</strong> Placing an order represents a commitment to purchase or 
                    rent. Orders are validated against local payment references (e.g. M-Pesa).
                  </li>
                  <li>
                    <strong className="text-slate-800">Asset Responsibility:</strong> Members renting parish assets must return 
                    them in the exact same condition. Damaged, lost, or broken items are subject to repair or replacement costs.
                  </li>
                  <li>
                    <strong className="text-slate-800">Cancellations:</strong> Booking or order cancellations must be made 
                    at least 48 hours prior to the event date to prevent administrative retention fees.
                  </li>
                </ul>
              </div>
            </section>

            {/* 4. Donations & Support */}
            <section
              id="donations"
              className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Landmark className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  4. Donations &amp; Financial Support
                </h2>
              </div>
              <div className="text-slate-600 space-y-4 text-sm sm:text-base leading-relaxed font-medium">
                <p>
                  Financial support contributed through the donation dashboard goes directly toward parish projects, 
                  devotional materials, and community outreach campaigns:
                </p>
                <ul className="space-y-3 pl-4 border-l-2 border-amber-100">
                  <li>
                    <strong className="text-slate-800">Voluntary Basis:</strong> All tithing, projects contributions, and collections 
                    made on the platform are strictly voluntary.
                  </li>
                  <li>
                    <strong className="text-slate-800">Receipts & Records:</strong> Transaction details are recorded securely 
                    and displayed within your private dashboard. These are not shared with external entities.
                  </li>
                </ul>
              </div>
            </section>

            {/* 5. Disclaimers & Liability */}
            <section
              id="disclaimers"
              className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  5. Disclaimers &amp; Limitation of Liability
                </h2>
              </div>
              <div className="text-slate-600 space-y-4 text-sm sm:text-base leading-relaxed font-medium">
                <p>
                  The services and information on this portal are provided on an "as is" and "as available" basis. 
                  St. Thomas Aquinas CSA makes no warranty that:
                </p>
                <ul className="space-y-3 pl-4 border-l-2 border-rose-100">
                  <li>The site will operate completely error-free or uninterrupted.</li>
                  <li>All daily liturgical scriptures or parish schedules are always perfect (please double-check with the parish secretary for critical updates).</li>
                  <li>The platform will be free of technical bugs. We actively check and patch issues, but do not warrant absolute uptime.</li>
                </ul>
              </div>
            </section>

            {/* 6. Terms & Updates */}
            <section
              id="termination"
              className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  6. Changes to Terms
                </h2>
              </div>
              <div className="text-slate-600 space-y-4 text-sm sm:text-base leading-relaxed font-medium">
                <p>
                  We reserve the right to revise these Terms and Conditions at any time. When updates occur, 
                  we will update the "Last Updated" date at the top of this document.
                </p>
                <p>
                  Your continued use of the platform after updates indicates your acceptance of the revised conditions. 
                  If you have suggestions or concerns, please contact the CSA executive committee.
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
