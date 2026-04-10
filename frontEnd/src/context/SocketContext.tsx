

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from "react";

import socketio from "socket.io-client";
import { LocalStorage } from "../utils/index.ts";

// Function to establish a socket connection with authorization token
const getSocket = () => {
  const token = LocalStorage.get("token"); // Retrieve jwt token from local storage or cookie
  // Create a socket connection with the provided URI and authentication
  return socketio(import.meta.env.VITE_SOCKET_URI, {
    withCredentials: true, //this will help us to use cookies directly tokens if user is not using local storage , by default token from cookies are added to request
    auth: { token },
  });
};

// Create a context to hold the socket instance
const SocketContext = createContext<{socket: ReturnType<typeof socketio> | null;}>({socket: null,});

// Custom hook to access the socket instance from the context
const useSocket = () => useContext(SocketContext);

// SocketProvider component to manage the socket instance and provide it through context
const SocketProvider: React.FC<{ children: React.ReactNode }> = ({children,}) => {

   const [socket] = useState<ReturnType<typeof socketio> | null>(() => getSocket());

  return (
    // Provide the socket instance through context to its children
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

// Export the SocketProvider component and the useSocket hook for other components to use
export { SocketProvider, useSocket };
