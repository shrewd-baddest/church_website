

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";

import socketio from "socket.io-client";

import { useAuth } from "./AuthContext.tsx";

// Function to establish a socket connection with authorization token
const getSocket = (token: string | undefined): ReturnType<typeof socketio> | null => { 
  if (!token) return null;
  return socketio(import.meta.env.VITE_SOCKET_URI, {
    withCredentials: true,
    auth: { token },
  });
};

// Create a context to hold the socket instance
const SocketContext = createContext<{ socket: ReturnType<typeof socketio> | null }>({ socket: null });

// Custom hook to access the socket instance from the context
const useSocket = () => useContext(SocketContext);

// SocketProvider component to manage the socket instance and provide it through context
const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<ReturnType<typeof socketio> | null>(null);

  useEffect(() => {
    if (user?.accessToken) {
      const newSocket = getSocket(user.accessToken);
      setSocket(newSocket);
      return () => {
        newSocket?.close();
      };
    } else {
      setSocket(null);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketProvider, useSocket };
