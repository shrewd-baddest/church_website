import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaBell, FaPlus } from "react-icons/fa";
import { MdEvent, MdUpdate } from "react-icons/md";
import type { fileUpload } from "../../../interface/api";
import { useNotifications } from "../../../context/NotificationContext";
import { useAuth } from "../../../context/AuthContext";
import {
  createNotificationEventApi,
} from "../../../api/axiosInstance";
import NotificationModal from "../components/NotificationModal";

const Notifications: React.FC = () => {
  const { notifications, markAllAsRead,  refreshNotifications, isConnected, socketError } = useNotifications();
  const { user } = useAuth();

  const [activeCategory, setActiveCategory] = useState<
    "csa" | "jumuiya" | null
    
  >(null);
  const [showModal, setShowModal] = useState(false);

  const roles = useMemo(() => user?.role ? [user.role] : [], [user?.role]);
  const isAdmin = true;

  // Sync "read" status when category is active
  useEffect(() => {
    if (activeCategory) {
      markAllAsRead(activeCategory);
    }
  }, [activeCategory, markAllAsRead]);

  const createNotification = useCallback( async ({title, message, images, status ,  posted_to }: {title: string;   message: string;  images?: fileUpload[];  status: string; posted_to:string }) => {
      try {
        const payload = { title, message, images, status, posted_to };
        await createNotificationEventApi(payload);
        // Refresh to show new notification (context will also receive socket event)
        refreshNotifications();
      } catch (error) {
        console.error("Failed to create notification:", error);
      }
    },
    [refreshNotifications],
  );

  const unreadCSA = notifications.filter(
    (e) => e.category === "csa" && !e.read,
  ).length;
  const unreadJumuiya = notifications.filter(
    (e) => e.category === "jumuiya" && !e.read,
  ).length;
  const totalUnread = unreadCSA + unreadJumuiya;

  const openCategory = (cat: "csa" | "jumuiya") => {
    setActiveCategory(cat);
    markAllAsRead(cat);
  };

  const filteredEvents = activeCategory
    ? notifications.filter((e) => e.category === activeCategory)
    : [];


  return (
    <div className="py-5 px-4 pb-32">
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
            <MdUpdate className="text-xl" />
            <span className="text-sm font-medium">
             Updates will sync once you're connected
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
