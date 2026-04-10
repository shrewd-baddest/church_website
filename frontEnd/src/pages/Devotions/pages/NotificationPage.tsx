import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaBell, FaPlus } from "react-icons/fa";
import { CiWifiOff } from "react-icons/ci";
import { MdEvent } from "react-icons/md";
import type { Event, fileUpload, SocketError } from "../../../interface/api";
import { useSocket } from "../../../context/SocketContext";
import { useAuth } from "../../../context/AuthContext";
import {
  createNotificationEventApi,
  fetchNotifications,
} from "../../../api/axiosInstance";
import NotificationModal from "../components/NotificationModal";

const Notifications: React.FC = () => {
  const { socket } = useSocket(); //help us connect to the socket server and listen for events
  const { user } = useAuth(); //help us get the user info and determine which jumuiya they belong to and join the correct room for notifications

  const [activeCategory, setActiveCategory] = useState<
    "csa" | "jumuiya" | null
  >(null);
  const [showModal, setShowModal] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Event[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [socketError, setSocketError] = useState<any>(null);
  const [isReadyForNotifications, setIsReadyForNotifications] = useState(false);

  // Get roles from user context
  //reason for using memo is to avoid unnecessary re-computation of roles array on every render,
  // it will only recompute when user.role changes. This is important because roles are used in
  //  multiple places (like determining if user is admin and controlling access to the modal) and
  // we want to ensure that those checks are efficient and only update when necessary.
  const roles = useMemo(() => user?.role ?? [], [user?.role]);

  // Determine if user is admin (can post to CSA and/or Jumuiya)
  // A user is considered an admin if they have either the "CSA_LEADER" or "JUMUIA_LEADER" role
  // This will control access to the notification creation modal and the ability to post notifications
  //users without this titles will just be able to read the notifications
  // const isAdmin = roles.includes("CSA_LEADER") || roles.includes("JUMUIA_LEADER");
  const isAdmin = true;

  //  Event constants (MUST match backend exactly)
  const CONNECTED_EVENT = "connected";
  const DISCONNECT_EVENT = "disconnect";
  const JOIN_INDIVIDUAL_JUMUIA_EVENT = "joinJumuiya";
  const NOTIFY_CSA_ON_NEW_NOTIFICATION_EVENT = "notifyCsa";
  const NOTIFY_SPECIFIC_JUMUIA_ON_NEW_NOTIFICATION_EVENT = "notifyJumuiya";
  const NOTIFICATION_UPDATED_EVENT = "notificationUpdated";
  const NOTIFICATION_DELETE_EVENT = "notificationDelete";
  const SOCKET_ERROR_EVENT = "socketError";

  // 1. onConnect
  const onConnect = useCallback(() => {
    setIsConnected(true);
    if (socket && user?.jumuiya_id) {
      socket.emit(JOIN_INDIVIDUAL_JUMUIA_EVENT, user.jumuiya_id);
    }
  }, [socket, user?.jumuiya_id]);

  // 2. onDisconnect
  const onDisconnect = useCallback(() => {
    setIsConnected(false);
  }, []);

  // 3. handleNewNotification
  const handleNewNotification = useCallback((msg: Event) => {
    const normalizedEvent: Event = {
      id: msg.id,
      text: msg.text || "New notification",
      category: msg.category === "csa" ? "csa" : "jumuiya",
      posted_by: msg.posted_by || "system",
      createdAt: msg.createdAt || new Date().toISOString(),
      read: false,
      images: Array.isArray(msg.images) ? msg.images : [],
    };
    setNotifications((prev) => [normalizedEvent, ...prev]);
  }, []);

  // 4. handleUpdateNotification
  const handleUpdateNotification = useCallback((updatedMsg: Event): void => {
    setNotifications((prev: Event[]) => {
      const filtered = prev.filter((n) => n.id !== updatedMsg.id);
      return [updatedMsg, ...filtered];
    });
  }, []);

  // 5. handleDeleteNotification
  const handleDeleteNotification = useCallback(
    (payload: { id: string }): void => {
      const { id } = payload;
      setNotifications((prev: Event[]) => prev.filter((n) => n.id !== id));
    },
    [],
  );

  // 6. onErrorHandler
  const onErrorHandler = useCallback((error: SocketError) => {
    console.error("Socket error occurred:", error.message || error);
    setSocketError(error);
  }, []);

  const createNotification = useCallback( async ({title, message, images, status ,  posted_to }: {title: string;   message: string;  images?: fileUpload[];  status: string; posted_to:string }) => {
      // if (!user || !socket) return;
      if (!socket) return;

      const payload = {
        title,
        message,
        images,
        status,
        posted_to,
      };

      try {
        // 1. Save to DB via your backend API
        console.log("api calling starting with ", payload);
        const res = await createNotificationEventApi(payload);
        console.log("Notification created in DB:", res.data);

        // 2. Emit socket event with saved notification
        if (roles.includes("CSA_LEADER")) {
          socket.emit(NOTIFY_CSA_ON_NEW_NOTIFICATION_EVENT, {
            ...payload,
            posted_to: "csa",
          });
        } else {
          socket.emit(NOTIFY_SPECIFIC_JUMUIA_ON_NEW_NOTIFICATION_EVENT, {
            jumuiaName: user?.jumuiya_id,
            message: {
              ...payload,
              posted_to: user?.jumuiya_id,
            },
          });
        }
      } catch (error) {
        console.error("Failed to create notification:", error);
      }
    },
    [user, socket, roles],
  );

  //  Function: getNotifications
  useEffect(() => {
    if (user) {
      const getNotifications = async () => {
        try {
          setLoadingNotifications(true);
          const res = await fetchNotifications(user.jumuiya_id);
          setNotifications(res.data);
          setIsReadyForNotifications(true);
          console.log("User is ready to receive live notifications");
        } catch (error) {
          console.error("Error fetching notifications:", error);
        } finally {
          setLoadingNotifications(false);
        }
      };
      getNotifications();
    } else {
      // Reset on logout
      setIsReadyForNotifications(false);
      setNotifications([]);
    }
  }, [user]);

  //  Attach socket listeners only when ready
  useEffect(() => {
    if (!socket) return;

    // csaNotification
    // listen for Connection
    socket.on(CONNECTED_EVENT, onConnect);
    socket.on(DISCONNECT_EVENT, onDisconnect);

    // listen for New notifications
    socket.on("csaNotification", handleNewNotification);
    socket.on(NOTIFY_SPECIFIC_JUMUIA_ON_NEW_NOTIFICATION_EVENT, handleNewNotification);
    //  listen for Updates event from the server
    socket.on(NOTIFICATION_UPDATED_EVENT, handleUpdateNotification);
    // listen for delete event from the server
    socket.on(NOTIFICATION_DELETE_EVENT, handleDeleteNotification);
    //  Errors
    socket.on(SOCKET_ERROR_EVENT, onErrorHandler);

    return () => {
      socket.off(CONNECTED_EVENT, onConnect);
      socket.off(DISCONNECT_EVENT, onDisconnect);

      socket.off(NOTIFY_CSA_ON_NEW_NOTIFICATION_EVENT, handleNewNotification);
      socket.off(
        NOTIFY_SPECIFIC_JUMUIA_ON_NEW_NOTIFICATION_EVENT,
        handleNewNotification,
      );

      socket.off(NOTIFICATION_UPDATED_EVENT, handleUpdateNotification);
      socket.off(NOTIFICATION_DELETE_EVENT, handleDeleteNotification);

      socket.off(SOCKET_ERROR_EVENT, onErrorHandler);
    };
  }, [
    socket,
    isReadyForNotifications,
    onConnect,
    onDisconnect,
    handleNewNotification,
    handleUpdateNotification,
    handleDeleteNotification,
    onErrorHandler,
  ]);

  const unreadCSA = notifications.filter(
    (e) => e.category === "csa" && !e.read,
  ).length;
  const unreadJumuiya = notifications.filter(
    (e) => e.category === "jumuiya" && !e.read,
  ).length;
  const totalUnread = unreadCSA + unreadJumuiya;

  const openCategory = (cat: "csa" | "jumuiya") => {
    setActiveCategory(cat);
    setNotifications((prev) =>
      prev.map((e) => (e.category === cat ? { ...e, read: true } : e)),
    );
  };

  const filteredEvents = activeCategory
    ? notifications.filter((e) => e.category === activeCategory)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 py-5 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex justify-between items-center border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600 text-xl">
              <FaBell />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Notifications</h1>
              <p className="text-sm text-gray-500">Stay updated in real-time</p>
            </div>
          </div>

          {totalUnread > 0 && (
            <div className="bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded-full shadow-sm animate-pulse">
              {totalUnread} New
            </div>
          )}
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl  mt-4">
            <CiWifiOff className="text-xl" />
            <span className="text-sm font-medium">
              You’re offline. Updates will sync once you're back online.
            </span>
          </div>
        )}

        {/* Loading */}
        {loadingNotifications && (
          <div className="flex items-center justify-center gap-3 bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded-xl">
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                className="opacity-25"
              />
            </svg>
            <span className="text-sm font-medium">
              Fetching latest notifications...
            </span>
          </div>
        )}

        {/* Error */}
        {socketError && (
          <div className="flex gap-3 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Connection problem</p>
              <p className="text-sm">
                {socketError.message || "Unable to reach notification server."}
              </p>
            </div>
          </div>
        )}

        {/* Category Selector */}
        <div className="flex gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-200 w-fit mt-3 mb-3 ">
          <button
            onClick={() => openCategory("csa")}
            className={`px-5 py-2 rounded-full font-medium transition ${
              activeCategory === "csa"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            📘 CSA
            {unreadCSA > 0 && (
              <span className="ml-2 text-xs bg-white text-blue-600 px-2 py-0.5 rounded-full">
                {unreadCSA}
              </span>
            )}
          </button>

          <button
            onClick={() => openCategory("jumuiya")}
            className={`px-5 py-2 rounded-full font-medium transition ${
              activeCategory === "jumuiya"
                ? "bg-green-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            🏡 Jumuiya
            {unreadJumuiya > 0 && (
              <span className="ml-2 text-xs bg-white text-green-600 px-2 py-0.5 rounded-full">
                {unreadJumuiya}
              </span>
            )}
          </button>
        </div>

        {/* No Category Selected */}
        {!activeCategory && (
          <div className="text-center rounded-2xl p-10 bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-100 shadow-sm">
            <div className="flex justify-center mb-5">
              <FaBell className="text-4xl text-blue-500 animate-[pulse_2s_infinite]" />
            </div>

            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Choose a Category
            </h2>

            <p className="text-sm text-gray-600 max-w-md mx-auto mb-4">
              Select <span className="font-medium text-blue-600">CSA</span> or{" "}
              <span className="font-medium text-green-600">Jumuiya</span> to
              view updates.
            </p>

            <p className="text-xs text-gray-500">
              Notifications are grouped to help you stay organized.
            </p>
          </div>
        )}

        {/* Empty Category */}
        {activeCategory && filteredEvents.length === 0 && (
          <div className="text-center rounded-2xl p-10 bg-gray-50 border border-gray-200 shadow-sm">
            <div className="flex justify-center mb-5">
              <MdEvent className="text-5xl text-gray-400 animate-[pulse_2s_infinite]" />
            </div>

            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              No notifications yet
            </h2>

            <p className="text-sm text-gray-600 max-w-md mx-auto">
              You're all caught up. New updates will appear here when available.
            </p>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const isJumuiya = event.category === "jumuiya";

            return (
              <div
                key={event.id}
                className={`bg-white rounded-2xl shadow-sm p-5 border-l-4 ${
                  isJumuiya ? "border-green-500" : "border-blue-500"
                } hover:shadow-md transition`}
              >
                <div className="flex justify-between items-start">
                  <h2 className="font-semibold text-gray-800">{event.text}</h2>
                  <span className="text-xs text-gray-400">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Posted by {event.posted_by}
                </p>

                {Array.isArray(event.images) && event.images.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    {event.images.slice(0, 3).map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt="event"
                        className="w-20 h-20 object-cover rounded-xl shadow-sm hover:scale-105 transition"
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Floating Admin Button */}
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition hover:scale-110"
          >
            <FaPlus />
          </button>
        )}

        {/* Modal */}
        {showModal && (
          <NotificationModal
            roles={roles} // pass roles to modal
            createNotification={createNotification}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Notifications;
