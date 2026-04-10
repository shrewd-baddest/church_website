import React from 'react';
import { Bell, MessageSquare, Heart, Clock, Check, X } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'suggestion' | 'donation' | 'system';
  title: string;
  message: string;
  time: string;
  rawDate: string;
  isRead: boolean;
  link?: string;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationDropdown({ 
  notifications, 
  onClose, 
  onMarkAsRead, 
  onClearAll 
}: NotificationDropdownProps) {
  return (
    <div className="absolute right-0 mt-4 w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="text-lg font-black text-slate-800">Notifications</h3>
          <p className="text-xs text-slate-500 font-medium">You have {notifications.filter(n => !n.isRead).length} unread messages</p>
        </div>
        <div className="flex items-center gap-2">
            <button 
              onClick={onClearAll}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              title="Clear All"
            >
              <Check size={18} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
            >
              <X size={18} />
            </button>
        </div>
      </div>

      <div className="max-h-[450px] overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-5 hover:bg-slate-50 transition-all cursor-pointer relative group ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                onClick={() => onMarkAsRead(notification.id)}
              >
                {!notification.isRead && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></span>
                )}
                
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    notification.type === 'suggestion' ? 'bg-indigo-100 text-indigo-600' :
                    notification.type === 'donation' ? 'bg-rose-100 text-rose-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {notification.type === 'suggestion' ? <MessageSquare size={20} /> :
                     notification.type === 'donation' ? <Heart size={20} fill="currentColor" /> :
                     <Bell size={20} />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{notification.title}</p>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter shrink-0">{notification.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{notification.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 px-8 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <Bell size={32} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1">No new notifications at the moment.</p>
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-4 border-t border-slate-50 text-center bg-slate-50/30">
          <button 
            className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest"
            onClick={onClose}
          >
            Close Panel
          </button>
        </div>
      )}
    </div>
  );
}
