import React, { useEffect, useState } from "react";
import { FaBell, FaPlus } from "react-icons/fa";
import { MdEvent } from "react-icons/md";
import { AiOutlineClose } from "react-icons/ai";
import type { Event } from "../../../interface/api";
import { useSocket } from "../../../context/SocketContext";
import { useAuth } from "../../../context/AuthContext";



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
  const isAdmin = true;
  const initialEvents: Event[] = [];

  const [events, setEvents] = useState(initialEvents);
  const [activeCategory, setActiveCategory] = useState<"csa" | "jumuiya" | null>(null);
  const [showModal, setShowModal] = useState(false);

const [isConnected, setIsConnected] = useState(false);
const [notifications, setNotifications] = useState<Event[]>([]);
const [loadingNotifications, setLoadingNotifications] = useState(false);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const [socketError, setSocketError] = useState<any>(null);
const [isReadyForNotifications, setIsReadyForNotifications] = useState(false);

 const {socket} = useSocket();
 const {user } = useAuth();



//  Example events
const CONNECTED_EVENT = "connect";
const DISCONNECT_EVENT = "disconnect";
const NOTIFY_CSA_ON_NEW_NOTIFICATION_EVENT = "notifyCsa";
const NOTIFY_SPECIFIC_JUMUIA_ON_NEW_NOTIFICATION_EVENT = "notifyJumuiya";
const NOTIFICATION_RECEIVED_EVENT = "notificationReceived";
const NOTIFICATION_DELETE_EVENT = "notificationDelete";



// Function 1: onConnect
const onConnect = () => {
  setIsConnected(true);
  if (socket && user?.jumuiya_id) {
    socket.emit(NOTIFY_SPECIFIC_JUMUIA_ON_NEW_NOTIFICATION_EVENT, { jumuiyaId: user.jumuiya_id });
  }
  console.log("Connected to server and joined CSA + Jumuiya rooms");
};

//  Function 2: onDisconnect
const onDisconnect = () => {
  setIsConnected(false);
  console.log("Disconnected from server");
};

//  Unified notification handler
const handleNotification = (msg: Notification) => {
  setNotifications((prev) => [msg, ...prev]);
  console.log(`${msg.category} notification received:`, msg);
};

// // // Unified delete handler
const removeNotification = (id: string, emitToServer = false) => {
  if (emitToServer && socket && isConnected) {
    socket.emit(NOTIFICATION_DELETE_EVENT, id);
  }
  setNotifications((prev) => prev.filter((n) => n.id !== id));
  console.log("Notification removed:", id);
};

// // // Function: sendNotification
const sendNotification = (msg: Notification) => {
  if (!socket || !isConnected) return;
  socket.emit(NOTIFICATION_RECEIVED_EVENT, msg);
  setNotifications((prev) => [msg, ...prev]);
  console.log("Notification sent:", msg);
};

// // // Function: getNotifications
const getNotifications = async () => {
  try {
    setLoadingNotifications(true);
    const res = await axios.get(`/api/notifications?jumuiyaId=${user.jumuiya_id}`);
    setNotifications(res.data);
    setIsReadyForNotifications(true);
    console.log("User is ready to receive live notifications");
  } catch (error) {
    console.error("Error fetching notifications:", error);
  } finally {
    setLoadingNotifications(false);
  }
};

// // // Unified update handler
const updateNotification = (updatedMsg?: Notification, deletedId?: string) => {
  setNotifications((prev) => {
    if (deletedId) {
      return prev.filter((n) => n.id !== deletedId);
    }
    if (updatedMsg) {
      const withoutUpdated = prev.filter((n) => n.id !== updatedMsg.id);
      return [updatedMsg, ...withoutUpdated];
    }
    return prev;
  });
};

// // // Function: onErrorHandler
const onErrorHandler = (error: any) => {
  console.error("Socket error occurred:", error);
  setSocketError(error);
};

// // // Fetch notifications on login
useEffect(() => {
  if (user) {
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

  socket.on(CONNECTED_EVENT, onConnect);
  socket.on(DISCONNECT_EVENT, onDisconnect);
  socket.on(NOTIFY_CSA_ON_NEW_NOTIFICATION_EVENT, handleNotification);
  socket.on(NOTIFY_SPECIFIC_JUMUIA_ON_NEW_NOTIFICATION_EVENT, handleNotification);
  socket.on(NOTIFICATION_RECEIVED_EVENT, handleNotification);
  socket.on(NOTIFICATION_DELETE_EVENT, (id: string) => removeNotification(id));
  socket.on("socketError", onErrorHandler);

  return () => {
    socket.off(CONNECTED_EVENT, onConnect);
    socket.off(DISCONNECT_EVENT, onDisconnect);
    socket.off(NOTIFY_CSA_ON_NEW_NOTIFICATION_EVENT, handleNotification);
    socket.off(NOTIFY_SPECIFIC_JUMUIA_ON_NEW_NOTIFICATION_EVENT, handleNotification);
    socket.off(NOTIFICATION_RECEIVED_EVENT, handleNotification);
    socket.off(NOTIFICATION_DELETE_EVENT, (id: string) => removeNotification(id));
    socket.off("socketError", onErrorHandler);
  };
}, [socket, isReadyForNotifications]);


  const unreadCSA = events.filter((e) => e.category === "csa" && !e.read).length;
  const unreadJumuiya = events.filter((e) => e.category === "jumuiya" && !e.read).length;
  const totalUnread = unreadCSA + unreadJumuiya;



  const openCategory = (cat: "csa" | "jumuiya") => {
    setActiveCategory(cat);
    setEvents((prev) =>
      prev.map((e) => (e.category === cat ? { ...e, read: true } : e)),
    );
  };

  const filteredEvents = activeCategory ? events.filter((e) => e.category === activeCategory): [];

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

      {/* Category Counters */}
      <div className="flex gap-6 mb-6">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl w-[28rem] relative shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              <AiOutlineClose size={20} />
            </button>

            {/* Title */}
            <h2 className="text-2xl font-bold mb-6 text-green-700 text-center">
              Create New Event
            </h2>

            {/* Form */}
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Event Title"
                className="w-full border border-green-300 p-2 rounded-lg focus:ring-2 focus:ring-green-400"
              />
              <input
                type="date"
                className="w-full border border-green-300 p-2 rounded-lg focus:ring-2 focus:ring-green-400"
              />
              <textarea
                placeholder="Description"
                className="w-full border border-green-300 p-2 rounded-lg focus:ring-2 focus:ring-green-400"
              />

              {/* Image upload */}
              <div>
                <label className="block text-sm font-semibold text-green-700 mb-2">
                  Attach Images maximum allowed 3 only
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="w-full border border-green-300 p-2 rounded-lg focus:ring-2 focus:ring-green-400"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 3) {
                      alert("You can only upload up to 3 images.");
                      e.target.value = ""; // reset
                    }
                  }}
                />
              </div>

              {/* Category select */}
              <select className="w-full border border-green-300 p-2 rounded-lg focus:ring-2 focus:ring-green-400">
                <option value="jumuiya">Jumuiya</option>
                <option value="csa">CSA</option>
              </select>


              {/* Submit button */}
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 shadow-md font-semibold"
              >
                Save Event
              </button>


            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
