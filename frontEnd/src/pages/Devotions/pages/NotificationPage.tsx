import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaBell, FaPlus, FaCheckCircle, FaInbox, FaUsers, FaChurch, FaRegClock } from "react-icons/fa";
import { MdUpdate, MdHistory } from "react-icons/md";
import type { fileUpload } from "../../../interface/api";
import { useNotifications } from "../../../context/NotificationContext";
import { useAuth } from "../../../context/AuthContext";
import { createNotificationEventApi } from "../../../api/axiosInstance";
import NotificationModal from "../components/NotificationModal";
import { timeAgo } from "../../../utils";

// --- Components ---

const EmptyState: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  gradient: string; 
}> = ({ icon, title, description, gradient }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in zoom-in duration-700">
    <div className={`w-20 h-20 rounded-2xl ${gradient} flex items-center justify-center text-white text-3xl shadow-xl mb-6 relative border-2 border-white/50 backdrop-blur-sm group`}>
      <div className="absolute inset-0 rounded-2xl bg-white/10 blur-xl group-hover:blur-2xl transition-all" />
      <div className="relative z-10 transition-transform group-hover:scale-110">
        {icon}
      </div>
    </div>
    <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">{title}</h3>
    <p className="text-gray-500 max-w-xs font-bold text-xs leading-relaxed">{description}</p>
  </div>
);

const NotificationCard: React.FC<{ event: any }> = ({ event }) => {
  const isJumuiya = event.category === "jumuiya";
  const avatarBg = isJumuiya ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100";
  const Icon = isJumuiya ? FaUsers : FaChurch;

  return (
    <div className="group relative bg-white/80 backdrop-blur-sm rounded-[32px] p-6 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
       {/* New Badge */}
       {!event.read && (
         <div className="absolute top-6 right-6 px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-blue-500/30 animate-pulse">
            New
         </div>
       )}
       
       <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar Area */}
          <div className="relative shrink-0 flex items-start justify-center">
             <div className={`w-14 h-14 rounded-3xl ${avatarBg} border-2 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                <Icon />
             </div>
             {/* Dynamic Status Glow */}
             {!event.read && (
               <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isJumuiya ? 'bg-emerald-500' : 'bg-blue-500'}`} />
             )}
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
             <div className="flex items-center flex-wrap gap-2 mb-2">
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${isJumuiya ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                   {event.category}
                </span>
                {event.status === 'urgent' && (
                  <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-700 flex items-center gap-1">
                     <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                     Urgent
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 ml-auto">
                   <FaRegClock className="text-[10px]" />
                   {timeAgo(event.createdAt)}
                </span>
             </div>
             
             <h4 className="text-lg font-black text-gray-900 leading-tight mb-2 pr-12 group-hover:text-blue-600 transition-colors">
                {event.text}
             </h4>
             
             <p className="text-sm text-gray-500 font-medium mb-5 leading-relaxed">
                {event.posted_by} shared an update to the community.
             </p>

             {Array.isArray(event.images) && event.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                   {event.images.slice(0, 3).map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group/img shadow-sm">
                         <img src={img} alt="attachment" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700" />
                         <div className="absolute inset-0 bg-black/5 group-hover/img:bg-transparent transition-colors" />
                      </div>
                   ))}
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

const Notifications: React.FC = () => {
  const { notifications, markAllAsRead, refreshNotifications, isConnected, socketError } = useNotifications();
  const { user } = useAuth();

  const [activeCategory, setActiveCategory] = useState<"csa" | "jumuiya" | null>(null);
  const [showModal, setShowModal] = useState(false);

  const roles = useMemo(() => user?.role ?? [], [user?.role]);
  const isAdmin = true; // Hardcoded true as per previous logic

  useEffect(() => {
    if (activeCategory) {
      const hasUnread = notifications.some(n => n.category === activeCategory && !n.read);
      if (hasUnread) markAllAsRead(activeCategory);
    }
  }, [activeCategory, markAllAsRead, notifications]);

  const createNotification = useCallback(async (data: any) => {
    try {
      await createNotificationEventApi(data);
      refreshNotifications();
    } catch (error) {
      console.error("Failed to create notification:", error);
    }
  }, [refreshNotifications]);

  const unreadCSA = notifications.filter(e => e.category === "csa" && !e.read).length;
  const unreadJumuiya = notifications.filter(e => e.category === "jumuiya" && !e.read).length;
  const totalUnread = unreadCSA + unreadJumuiya;

  const filteredEvents = activeCategory
    ? notifications.filter((e) => e.category === activeCategory)
    : [];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-32">
       {/* Background Decoration */}
       <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
       </div>

       <div className="max-w-3xl mx-auto px-6 pt-4 sm:pt-6 relative z-10">
          {/* Header */}
          <div className="text-center mb-8 animate-in fade-in slide-in-from-top-6 duration-700">
             <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">
                Updates
             </h1>
             <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? (totalUnread > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500') : 'bg-gray-300'}`} />
                <p className={`font-black uppercase tracking-widest text-[10px] sm:text-xs transition-colors duration-500 ${totalUnread === 0 ? 'text-red-500' : 'text-gray-500'}`}>
                   {totalUnread > 0 ? `You have ${totalUnread} new messages` : '0 Unread Notifications'}
                </p>
             </div>
          </div>

          {!isConnected && (
            <div className="mb-6 flex items-center justify-center gap-2 text-amber-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-amber-50/50 border border-amber-100/50 backdrop-blur-sm">
               <MdUpdate className="text-base animate-spin" />
               Connecting...
            </div>
          )}

          {/* Switcher */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 bg-gray-200/50 backdrop-blur-md rounded-2xl border border-white gap-1.5 min-w-[300px]">
               <button
                  onClick={() => setActiveCategory("csa")}
                  className={`flex-1 py-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                     activeCategory === "csa" 
                     ? "bg-white text-blue-600 shadow-lg shadow-gray-200/50 scale-[1.02]" 
                     : "text-gray-500 hover:bg-white/40"
                  }`}
               >
                  CSA {unreadCSA > 0 && <span className="ml-1 text-blue-400">({unreadCSA})</span>}
               </button>
               <button
                  onClick={() => setActiveCategory("jumuiya")}
                  className={`flex-1 py-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                     activeCategory === "jumuiya" 
                     ? "bg-white text-emerald-600 shadow-lg shadow-gray-200/50 scale-[1.02]" 
                     : "text-gray-500 hover:bg-white/40"
                  }`}
               >
                  Jumuiya {unreadJumuiya > 0 && <span className="ml-1 text-emerald-400">({unreadJumuiya})</span>}
               </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="space-y-4 min-h-[400px]">
             {!activeCategory ? (
                <EmptyState 
                   icon={<FaInbox />}
                   title="Select a Channel"
                   description="Choose between CSA or your Jumuiya to see the latest announcements and events."
                   gradient="bg-gradient-to-br from-indigo-500 to-blue-600"
                />
             ) : filteredEvents.length === 0 ? (
                <EmptyState 
                   icon={<FaCheckCircle />}
                   title="All caught up!"
                   description={`There are no new notifications for ${activeCategory.toUpperCase()} right now.`}
                   gradient={activeCategory === 'csa' ? "bg-gradient-to-br from-blue-500 to-indigo-600" : "bg-gradient-to-br from-emerald-500 to-teal-600"}
                />
             ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
                   <div className="flex items-center gap-2 mb-6 px-1">
                      <MdHistory className="text-gray-400 text-lg" />
                      <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Recent Notifications</span>
                   </div>
                   {filteredEvents.map((event) => (
                      <NotificationCard key={event.id} event={event} />
                   ))}
                </div>
             )}
          </div>

          {/* Admin Action */}
          {isAdmin && (
            <button
               onClick={() => setShowModal(true)}
               className={`fixed z-50 flex items-center justify-center bg-black text-white shadow-2xl hover:bg-gray-900 transition-all duration-300 ease-out border border-gray-800 backdrop-blur-md group overflow-hidden ${
                 !!activeCategory 
                   ? "top-20 right-4 sm:top-24 sm:right-6 w-12 h-12 rounded-full hover:scale-110 active:scale-95 shadow-blue-900/20" 
                   : "top-[calc(100vh-6rem)] right-8 sm:top-[calc(100vh-7rem)] sm:right-10 px-8 h-14 rounded-full gap-3 hover:scale-105 active:scale-95"
               }`}
            >
               <FaPlus className={`text-lg transition-transform duration-300 shrink-0 ${!!activeCategory ? 'group-hover:rotate-180' : 'group-hover:rotate-90'}`} />
               <span className={`font-black uppercase tracking-[0.2em] transform transition-all duration-300 ${
                 !!activeCategory ? "text-[0px] w-0 opacity-0 translate-x-10" : "text-[10px] w-auto opacity-100 translate-x-0 pt-0.5"
               }`}>
                 Create Notification
               </span>
            </button>
          )}

        </div>

        {/* Modal - Moved outside relative z-10 container to float over Header */}
        {showModal && (
          <NotificationModal
             roles={roles}
             createNotification={createNotification}
             onClose={() => setShowModal(false)}
          />
        )}
     </div>
  );
};

export default Notifications;
