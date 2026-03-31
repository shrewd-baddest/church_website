import React, { useCallback, useEffect, useState } from "react";
import { FaBell, FaPlus } from "react-icons/fa";
import { MdEvent } from "react-icons/md";
import type { Event, fileUpload, SocketError } from "../../../interface/api";
import { useSocket } from "../../../context/SocketContext";
import { useAuth } from "../../../context/AuthContext";
import { fetchNotifications } from "../../../api/axiosInstace";
import NotificationModal from "../components/NotificationModal";

const jumuiyaColors = [
  "bg-green-100 border-green-500",
  "bg-purple-100 border-purple-500",
  "bg-orange-100 border-orange-500",
  "bg-teal-100 border-teal-500",
  "bg-pink-100 border-pink-500",
  "bg-yellow-100 border-yellow-500",
  "bg-red-100 border-red-500",
];

const Notifications: React.FC = () => {
  // we will fetch from useauth to determine if user is admin  and has permission or not and show add button accordingly
  const isAdmin = true;

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

  const { socket } = useSocket(); //help us connect to the socket server and listen for events
  const { user } = useAuth(); //help us get the user info and determine which jumuiya they belong to and join the correct room for notifications

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
    console.error("Socket error occurred:", error);
    setSocketError(error);
  }, []);

const createNotification = useCallback(
    async ({ title, message, images }: { title: string; message: string; images?: fileUpload[] }) => {
      if (!user || !socket) return;

      const payload = {
        title,
        message,
        posted_by: user.username,
        member_id: user.user_id,
        status: "active",
        images,
      };

      if (user.role === "csa_admin") {
        socket.emit(NOTIFY_CSA_ON_NEW_NOTIFICATION_EVENT, {...payload, posted_to: "csa",});
      } else {
        socket.emit(NOTIFY_SPECIFIC_JUMUIA_ON_NEW_NOTIFICATION_EVENT, {
          jumuiaName: user.jumuiya_id,
          message: {
            ...payload,
            posted_to: user.jumuiya_id,
          },
        });
      }
    },
    [user, socket],
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
    if (!socket || !isReadyForNotifications) return;

    // listen for Connection
    socket.on(CONNECTED_EVENT, onConnect);
    socket.on(DISCONNECT_EVENT, onDisconnect);

    // listen for New notifications
    socket.on(NOTIFY_CSA_ON_NEW_NOTIFICATION_EVENT, handleNewNotification);
    socket.on(
      NOTIFY_SPECIFIC_JUMUIA_ON_NEW_NOTIFICATION_EVENT,
      handleNewNotification,
    );
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
    <div className="p-6 max-w-3xl mx-auto ">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 relative">
          <FaBell />
          Notifications
          {totalUnread > 0 && (
            <span className="absolute -top-2 -right-3 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {totalUnread}
            </span>
          )}
        </h1>
      </div>

      {/* this shows the connection status to the serve for receiving notification */}
      <div className="mb-4">
        {isConnected ? (
          <div className="flex items-center gap-2 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg shadow-sm">
            <span className="text-lg">✅</span>
            <span className="font-medium">
              Connected to notification server
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg shadow-sm">
            <span className="text-lg">⚠️</span>
            <span className="font-medium">Disconnected from server</span>
          </div>
        )}
      </div>

      {/* Category Counters */}
      <div className="flex gap-6 mb-6">
        {loadingNotifications && (
          <div className="flex items-center justify-center gap-3 bg-blue-50 border border-blue-300 text-blue-700 px-4 py-3 rounded-lg shadow-sm mb-4 animate-pulse">
            <svg
              className="w-5 h-5 animate-spin text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
              ></path>
            </svg>
            <span className="font-medium">
              Loading notifications, please wait...
            </span>
          </div>
        )}

        {/* indicate if there was an error when getting the notification , error such as no socket connection */}
        {socketError && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg shadow-sm mb-4">
            <span className="text-xl">🚫</span>
            <div>
              <p className="font-semibold">
                We’re having trouble connecting to the notification server.
              </p>
              <p className="text-sm">
                {socketError.message ||
                  "Please check your internet connection or try again shortly."}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => openCategory("csa")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          CSA{" "}
          {unreadCSA > 0 && (
            <span className="bg-white text-blue-600 px-2 rounded-full">
              {unreadCSA}
            </span>
          )}
        </button>
        <button
          onClick={() => openCategory("jumuiya")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
        >
          Jumuiya{" "}
          {unreadJumuiya > 0 && (
            <span className="bg-white text-green-600 px-2 rounded-full">
              {unreadJumuiya}
            </span>
          )}
        </button>
      </div>

      {/* Default view if no category chosen */}
      {!activeCategory && (
        <div className="text-center p-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg shadow-md">
          <FaBell className="text-5xl text-blue-600 mb-4" />
          <h2 className="text-xl font-bold text-gray-700">
            Your Notifications
          </h2>
          <p className="text-gray-500">Choose CSA or Jumuiya to view details</p>
        </div>
      )}

      {/* Events List */}
      {activeCategory && filteredEvents.length === 0 ? (
        <div className="text-center p-10 bg-red-100 rounded-lg shadow-md">
          <MdEvent className="text-5xl text-red-600 mb-4" />
          <h2 className="text-xl font-bold text-red-700">No Notifications</h2>
          <p className="text-gray-600">You’re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event, idx) => {
            const jumuiyaStyle =
              event.category === "jumuiya"
                ? jumuiyaColors[idx % jumuiyaColors.length]
                : "bg-blue-100 border-blue-500";

            return (
              <div
                key={event.id}
                className={`p-4 rounded-lg shadow-md ${jumuiyaStyle}`}
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">{event.text}</h2>
                  <span className="text-sm text-gray-500">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Posted by: {event.posted_by}
                </p>
                {event.images && event.images.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {event.images.slice(0, 3).map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt="event"
                        className="w-24 h-24 object-cover rounded-lg shadow"
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Add Button */}
      {isAdmin && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 shadow-lg"
          >
            <FaPlus /> Add Notification
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <NotificationModal createNotification={createNotification} onClose={() => setShowModal(false)} />    
      )}
    </div>
  );
};

export default Notifications;
