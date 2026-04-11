import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import { fetchNotifications } from "../api/axiosInstance";
import type { Event } from "../interface/api";

export const NotificationEvents = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  JOIN_JUMUIYA: "joinIndividualJumuia",
  CSA_NOTIFICATION: "csaNotification",
  JUMUIYA_NOTIFICATION: "jumuiyaNotification",
  NOTIFICATION_UPDATED: "notificationUpdated",
  NOTIFICATION_DELETED: "notificationDeleted",
  SOCKET_ERROR: "socketError",
  CONNECT_ERROR: "connect_error",
} as const;

interface NotificationContextType {
  notifications: Event[];
  unreadCount: number;
  markAllAsRead: (category: "csa" | "jumuiya") => void;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  isConnected: boolean;
  socketError: any;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState<any>(null);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetchNotifications();
      if (res.data) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      setIsConnected(true);
      if (user?.jumuiya_id) {
        socket.emit(NotificationEvents.JOIN_JUMUIYA, user.jumuiya_id);
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    socket.on(NotificationEvents.CONNECTION, onConnect);
    socket.on(NotificationEvents.DISCONNECT, onDisconnect);
    if (socket.connected) onConnect();

    const handleNewNotification = (msg: any) => {
      const normalizedEvent: Event = {
        id: msg.id || Date.now().toString(),
        text: msg.text || msg.message?.title || "New notification",
        category: msg.category || (msg.message?.posted_to === "csa" ? "csa" : "jumuiya"),
        posted_by: msg.posted_by || "system",
        createdAt: msg.createdAt || new Date().toISOString(),
        read: false,
        images: Array.isArray(msg.images) ? msg.images : [],
      };
      setNotifications((prev) => [normalizedEvent, ...prev]);
    };

    const handleUpdateNotification = (updatedMsg: any) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === updatedMsg.id ? { ...n, ...updatedMsg } : n))
      );
    };

    const handleDeleteNotification = (payload: { id: string }) => {
      setNotifications((prev) => prev.filter((n) => n.id !== payload.id));
    };

    const onErrorHandler = (error: any) => {
      console.error("Socket error occurred:", error.message || error);
      setSocketError(error);
    };

    socket.on(NotificationEvents.CSA_NOTIFICATION, handleNewNotification);
    socket.on(NotificationEvents.JUMUIYA_NOTIFICATION, handleNewNotification);
    socket.on(NotificationEvents.NOTIFICATION_UPDATED, handleUpdateNotification);
    socket.on(NotificationEvents.NOTIFICATION_DELETED, handleDeleteNotification);
    socket.on(NotificationEvents.SOCKET_ERROR, onErrorHandler);
    socket.on(NotificationEvents.CONNECT_ERROR, onErrorHandler);

    return () => {
      socket.off(NotificationEvents.CONNECTION, onConnect);
      socket.off(NotificationEvents.DISCONNECT, onDisconnect);
      socket.off(NotificationEvents.CSA_NOTIFICATION, handleNewNotification);
      socket.off(NotificationEvents.JUMUIYA_NOTIFICATION, handleNewNotification);
      socket.off(NotificationEvents.NOTIFICATION_UPDATED, handleUpdateNotification);
      socket.off(NotificationEvents.NOTIFICATION_DELETED, handleDeleteNotification);
      socket.off(NotificationEvents.SOCKET_ERROR, onErrorHandler);
      socket.off(NotificationEvents.CONNECT_ERROR, onErrorHandler);
    };
  }, [socket, user]);

  const markAllAsRead = useCallback((category: "csa" | "jumuiya") => {
    setNotifications((prev) => {
      const hasUnread = prev.some((n) => n.category === category && !n.read);
      if (!hasUnread) return prev;
      return prev.map((n) => (n.category === category ? { ...n, read: true } : n));
    });
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
        loading,
        refreshNotifications,
        isConnected,
        socketError,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
