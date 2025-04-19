import { createContext } from "react";
import { io } from "socket.io-client";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socket = io("http://localhost:5000", {
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("SocketProvider connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("SocketProvider connect error:", err.message);
  });

  socket.on("disconnect", () => {
    console.log("SocketProvider disconnected");
  });

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
