import { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [socketReady, setSocketReady] = useState(false);

  useEffect(() => {
    const newSocket = io("http://localhost:5000", {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("SocketProvider: Connected with ID:", newSocket.id);
      setSocketReady(true);
    });

    newSocket.on("connect_error", (err) => {
      console.error("SocketProvider: Connect error:", {
        message: err.message,
        description: err.description,
      });
      setSocketReady(false);
      toast.error(
        "Không thể kết nối đến server thời gian thực. Đang thử kết nối lại...",
        { toastId: "socket-connect-error" } // Ngăn toast lặp lại
      );
    });

    newSocket.on("reconnect", (attempt) => {
      console.log("SocketProvider: Reconnected after", attempt, "attempts");
      setSocketReady(true);
      toast.success("Đã kết nối lại với server thời gian thực!", {
        toastId: "socket-reconnect-success",
      });
    });

    newSocket.on("disconnect", () => {
      console.log("SocketProvider: Disconnected");
      setSocketReady(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.off("connect");
      newSocket.off("connect_error");
      newSocket.off("reconnect");
      newSocket.off("disconnect");
      newSocket.disconnect();
      setSocketReady(false);
      setSocket(null);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, socketReady }}>
      {children}
    </SocketContext.Provider>
  );
};
