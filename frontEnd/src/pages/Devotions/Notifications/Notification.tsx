// import { useState, useEffect } from "react";

// type Notification = {
//   id: string;
//   text: string;
//   category: "csa" | "jumuiya";
//   posted_by: string;
//   createdAt: string;
//   read: boolean;
//   images?: string[];
// };


// // // Example events
// const CONNECTED_EVENT = "connect";
// const DISCONNECT_EVENT = "disconnect";
// const NOTIFY_CSA_ON_NEW_NOTIFICATION_EVENT = "notifyCsa";
// const NOTIFY_SPECIFIC_JUMUIA_ON_NEW_NOTIFICATION_EVENT = "notifyJumuiya";
// const NOTIFICATION_RECEIVED_EVENT = "notificationReceived";
// const NOTIFICATION_DELETE_EVENT = "notificationDelete";

// // // State
// const [isConnected, setIsConnected] = useState(false);
// const [notifications, setNotifications] = useState<Notification[]>([]);
// const [loadingNotifications, setLoadingNotifications] = useState(false);
// const [socketError, setSocketError] = useState<any>(null);

// // // New state: ready flag
// const [isReadyForNotifications, setIsReadyForNotifications] = useState(false);

// // // Function 1: onConnect
// const onConnect = () => {
//   setIsConnected(true);
//   // Join CSA room
//   socket.emit(NOTIFY_CSA_ON_NEW_NOTIFICATION_EVENT);
//   // Join jumuiya room (fixed per session)
//   if (user?.jumuiya_id) {
//     socket.emit(NOTIFY_SPECIFIC_JUMUIA_ON_NEW_NOTIFICATION_EVENT, { jumuiyaId: user.jumuiya_id });
//   }
//   console.log("Connected to server and joined CSA + Jumuiya rooms");
// };

// // // Function 2: onDisconnect
// const onDisconnect = () => {
//   setIsConnected(false);
//   console.log("Disconnected from server");
// };

// // // Unified notification handler
// const handleNotification = (msg: Notification) => {
//   setNotifications((prev) => [msg, ...prev]);
//   console.log(`${msg.category} notification received:`, msg);
// };

// // // Unified delete handler
// const removeNotification = (id: string, emitToServer = false) => {
//   if (emitToServer && socket && isConnected) {
//     socket.emit(NOTIFICATION_DELETE_EVENT, id);
//   }
//   setNotifications((prev) => prev.filter((n) => n.id !== id));
//   console.log("Notification removed:", id);
// };

// // // Function: sendNotification
// const sendNotification = (msg: Notification) => {
//   if (!socket || !isConnected) return;
//   socket.emit(NOTIFICATION_RECEIVED_EVENT, msg);
//   setNotifications((prev) => [msg, ...prev]);
//   console.log("Notification sent:", msg);
// };

// // // Function: getNotifications
// const getNotifications = async () => {
//   try {
//     setLoadingNotifications(true);
//     const res = await axios.get(`/api/notifications?jumuiyaId=${user.jumuiya_id}`);
//     setNotifications(res.data);
//     setIsReadyForNotifications(true);
//     console.log("User is ready to receive live notifications");
//   } catch (error) {
//     console.error("Error fetching notifications:", error);
//   } finally {
//     setLoadingNotifications(false);
//   }
// };

// // // Unified update handler
// const updateNotification = (updatedMsg?: Notification, deletedId?: string) => {
//   setNotifications((prev) => {
//     if (deletedId) {
//       return prev.filter((n) => n.id !== deletedId);
//     }
//     if (updatedMsg) {
//       const withoutUpdated = prev.filter((n) => n.id !== updatedMsg.id);
//       return [updatedMsg, ...withoutUpdated];
//     }
//     return prev;
//   });
// };

// // // Function: onErrorHandler
// const onErrorHandler = (error: any) => {
//   console.error("Socket error occurred:", error);
//   setSocketError(error);
// };

// // // Fetch notifications on login
// useEffect(() => {
//   if (user) {
//     getNotifications();
//   } else {
//     // Reset on logout
//     setIsReadyForNotifications(false);
//     setNotifications([]);
//   }
// }, [user]);

// // // Attach socket listeners only when ready
// useEffect(() => {
//   if (!socket || !isReadyForNotifications) return;

//   socket.on(CONNECTED_EVENT, onConnect);
//   socket.on(DISCONNECT_EVENT, onDisconnect);
//   socket.on(NOTIFY_CSA_ON_NEW_NOTIFICATION_EVENT, handleNotification);
//   socket.on(NOTIFY_SPECIFIC_JUMUIA_ON_NEW_NOTIFICATION_EVENT, handleNotification);
//   socket.on(NOTIFICATION_RECEIVED_EVENT, handleNotification);
//   socket.on(NOTIFICATION_DELETE_EVENT, (id: string) => removeNotification(id));
//   socket.on("socketError", onErrorHandler);

//   return () => {
//     socket.off(CONNECTED_EVENT, onConnect);
//     socket.off(DISCONNECT_EVENT, onDisconnect);
//     socket.off(NOTIFY_CSA_ON_NEW_NOTIFICATION_EVENT, handleNotification);
//     socket.off(NOTIFY_SPECIFIC_JUMUIA_ON_NEW_NOTIFICATION_EVENT, handleNotification);
//     socket.off(NOTIFICATION_RECEIVED_EVENT, handleNotification);
//     socket.off(NOTIFICATION_DELETE_EVENT, (id: string) => removeNotification(id));
//     socket.off("socketError", onErrorHandler);
//   };
// }, [socket, isReadyForNotifications]);

















