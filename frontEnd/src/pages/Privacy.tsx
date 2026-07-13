import React, { useState } from "react";
import { Shield, Eye, Lock, FileText, ArrowRight, Mail, Phone, MapPin } from "lucide-react";

export default function Privacy() {
  const [activeSection, setActiveSection] = useState("intro");

  const sections = [
    { id: "intro", title: "1. Introduction", icon: FileText },
    { id: "collect", title: "2. Information We Collect", icon: Eye },
    { id: "use", title: "3. How We Use Information", icon: Shield },
    { id: "security", title: "4. Security & Retention", icon: Lock },
    { id: "rights", title: "5. Your Rights & Choices", icon: Shield },
    { id: "contact", title: "6. Contact Us", icon: Mail },
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
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-6">
            <Shield className="w-3.5 h-3.5" />
            Privacy Integrity
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none mb-6">
            Privacy Policy
          </h1>
          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
            St. Thomas Aquinas Catholic Student Association (CSA) is committed to protecting your personal information.
            This policy outlines how we collect, use, and protect your data.
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
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
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
            
            {/* 1. Introduction */}
            <section
              id="intro"
              className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  1. Introduction
                </h2>
              </div>
              <div className="text-slate-600 space-y-4 text-sm sm:text-base leading-relaxed font-medium">
                <p>
                  Welcome to the St. Thomas Aquinas CSA platform. We respect your privacy and want to be transparent 
                  about how we handle your personal data. This privacy policy applies to all users of our web application 
                  and associated online community services.
                </p>
                <p>
                  By accessing or using our services, you consent to the collection, transfer, storage, disclosure, 
                  and use of your information as outlined in this policy. If you do not agree with this policy, please 
                  do not use our application.
                </p>
              </div>
            </section>

            {/* 2. Information We Collect */}
            <section
              id="collect"
              className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Eye className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  2. Information We Collect
                </h2>
              </div>
              <div className="text-slate-600 space-y-4 text-sm sm:text-base leading-relaxed font-medium">
                <p>
                  To provide our community services, register new members, process donations, and administer devotions, 
                  we collect several types of information:
                </p>
                <ul className="space-y-3 pl-4 border-l-2 border-indigo-100 mt-4">
                  <li>
                    <strong className="text-slate-800">Personal Identifiable Information:</strong> Full name, 
                    email address, phone number, university registration/membership ID, and community group details.
                  </li>
                  <li>
                    <strong className="text-slate-800">Feedback and Suggestions:</strong> Any comments or suggestions 
                    submitted via our digital suggestion box. Suggestions can be submitted anonymously, in which case 
                    we do not link them to your identity unless explicit unmasking consent is granted.
                  </li>
                  <li>
                    <strong className="text-slate-800">Financial Information:</strong> For donations, merchandise purchases 
                    (T-Shirts), or rental bookings (Chairs, Instruments), transaction identifiers and reference codes 
                    are collected to verify payments. We do not store full credit card details.
                  </li>
                </ul>
              </div>
            </section>

            {/* 3. How We Use Information */}
            <section
              id="use"
              className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Shield className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  3. How We Use Your Information
                </h2>
              </div>
              <div className="text-slate-600 space-y-4 text-sm sm:text-base leading-relaxed font-medium">
                <p>
                  We use the information we collect to operate, maintain, and improve our church community site. 
                  Specific purposes include:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <h4 className="font-bold text-slate-800 mb-2">Member Support & Safety</h4>
                    <p className="text-xs text-slate-500">
                      Managing accounts, authenticating logins, verifying emails, and keeping member lists accurate.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <h4 className="font-bold text-slate-800 mb-2">Community Communication</h4>
                    <p className="text-xs text-slate-500">
                      Sending daily devotions, system alerts, parish announcements, and news updates.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <h4 className="font-bold text-slate-800 mb-2">Transactional Verification</h4>
                    <p className="text-xs text-slate-500">
                      Verifying order status, processing donation receipts, and coordinating bookings.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <h4 className="font-bold text-slate-800 mb-2">Platform Improvement</h4>
                    <p className="text-xs text-slate-500">
                      Responding to anonymous feedback and enhancing user interface accessibility.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Security & Retention */}
            <section
              id="security"
              className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  4. Security & Data Retention
                </h2>
              </div>
              <div className="text-slate-600 space-y-4 text-sm sm:text-base leading-relaxed font-medium">
                <p>
                  We implement robust technical and organizational security measures to shield your data from unauthorized 
                  access, alteration, disclosure, or destruction:
                </p>
                <ul className="space-y-3 pl-4 border-l-2 border-rose-100">
                  <li>
                    <strong className="text-slate-800">Token-Based Authentication:</strong> All administrative endpoints and 
                    private resources are protected by secure JSON Web Tokens (JWT) and role-based validation.
                  </li>
                  <li>
                    <strong className="text-slate-800">Sensitive Table Isolation:</strong> Access to sensitive tables is 
                    programmatically blocked from general API requests to ensure member lists and financial balances are isolated.
                  </li>
                  <li>
                    <strong className="text-slate-800">Data Minimization:</strong> We only store data as long as necessary 
                    to support community operations or comply with local legal guidelines.
                  </li>
                </ul>
              </div>
            </section>

            {/* 5. Your Rights & Choices */}
            <section
              id="rights"
              className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Shield className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  5. Your Rights & Choices
                </h2>
              </div>
              <div className="text-slate-600 space-y-4 text-sm sm:text-base leading-relaxed font-medium">
                <p>
                  As a valued member of the St. Thomas Aquinas CSA, you hold certain rights regarding your personal information:
                </p>
                <ul className="space-y-3 pl-4 border-l-2 border-emerald-100">
                  <li>
                    <strong className="text-slate-800">Access & Rectification:</strong> You can review and update your 
                    registration data at any time by contacting the CSA secretariat or updating your profile.
                  </li>
                  <li>
                    <strong className="text-slate-800">Account Deletion:</strong> You have the right to request the deletion 
                    of your profile. Administrative approval is required to prevent accidental deletions.
                  </li>
                  <li>
                    <strong className="text-slate-800">Opt-Out:</strong> You may opt-out of notifications and updates by 
                    adjusting your settings.
                  </li>
                </ul>
              </div>
            </section>

            {/* 6. Contact Us */}
            <section
              id="contact"
              className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Mail className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  6. Contact Us
                </h2>
              </div>
              <p className="text-slate-600 mb-6 text-sm sm:text-base font-medium">
                If you have any questions or concerns regarding this Privacy Policy, feel free to reach out to our team:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <Mail className="w-5 h-5 text-purple-600 shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Email</div>
                    <div className="text-xs font-bold text-slate-800">csa@sta-kirinyaga.org</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <Phone className="w-5 h-5 text-purple-600 shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Phone</div>
                    <div className="text-xs font-bold text-slate-800">+254 700 000 000</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <MapPin className="w-5 h-5 text-purple-600 shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Location</div>
                    <div className="text-xs font-bold text-slate-800">Kirinyaga, Kenya</div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
