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
    console.log("SocketProvider: Connected with ID:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("SocketProvider: Connect error:", {
      message: err.message,
      description: err.description,
    });
    toast.error(
      "Không thể kết nối đến server thời gian thực. Vui lòng kiểm tra kết nối!"
    );
  });

  socket.on("disconnect", () => {
    console.log("SocketProvider: Disconnected");
  });

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
