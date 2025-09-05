import { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import axios from "axios";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [socketReady, setSocketReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const log = (message, data = {}) => {
    console.log(`[SocketProvider] ${message}`, data);
  };

  const initializeAuth = async () => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      log("No token found in localStorage");
      return;
    }
    setToken(storedToken);

    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/auth/profile",
          {
            headers: { Authorization: `Bearer ${storedToken}` },
            timeout: 5000,
          }
        );
        const fetchedUserId = response.data.user._id || response.data.user.id;
        log("Fetched user ID:", { userId: fetchedUserId });
        setUserId(fetchedUserId);
        return;
      } catch (err) {
        retries++;
        log(`Retry ${retries}/${maxRetries} failed:`, { error: err.message });
        if (retries === maxRetries) {
          log("Max retries reached, giving up");
          toast.error(
            "Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.",
            {
              toastId: "auth-error",
            }
          );
          localStorage.removeItem("token");
          setToken(null);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  };

  const joinWorkspaceRoom = (workspaceId) => {
    if (socket && socketReady) {
      socket.emit("join", workspaceId);
      log("Joined workspace room:", { workspaceId });
    } else {
      log("Cannot join workspace room, socket not ready:", { workspaceId });
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!token) {
      log("No token, skipping socket initialization");
      return;
    }

    if (socket) {
      socket.disconnect();
      socket.off("connect");
      socket.off("connect_error");
      socket.off("reconnect");
      socket.off("error");
      socket.off("disconnect");
      socket.off("user-status-changed");
    }

    const newSocket = io("http://localhost:5000", {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      auth: { token },
    });

    newSocket.on("connect", () => {
      log("Connected with ID:", { socketId: newSocket.id });
      setSocketReady(true);
    });

    newSocket.on("connect_error", (err) => {
      log("Connect error:", {
        message: err.message,
        description: err.description,
      });
      setSocketReady(false);
      toast.error(
        `Không thể kết nối đến server thời gian thực: ${err.message}. Đang thử lại...`,
        { toastId: "socket-connect-error" }
      );
      if (err.message.includes("Invalid token")) {
        localStorage.removeItem("token");
        setToken(null);
        setUserId(null);
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.", {
          toastId: "socket-invalid-token",
        });
      }
    });

    newSocket.on("reconnect", (attempt) => {
      log("Reconnected after attempts:", { attempt });
      setSocketReady(true);
      toast.success("Đã kết nối lại với server thời gian thực!", {
        toastId: "socket-reconnect-success",
      });
    });

    newSocket.on("error", (err) => {
      log("Socket error:", { error: err.message });
      toast.error(`Lỗi socket: ${err.message}`, { toastId: "socket-error" });
    });

    newSocket.on("disconnect", () => {
      log("Disconnected");
      setSocketReady(false);
      toast.warn("Mất kết nối với server thời gian thực.", {
        toastId: "socket-disconnect",
      });
    });

    newSocket.on("user-status-changed", ({ userId, isOnline }) => {
      log("Received user-status-changed:", { userId, isOnline });
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        if (isOnline) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.off("connect");
      newSocket.off("connect_error");
      newSocket.off("reconnect");
      newSocket.off("error");
      newSocket.off("disconnect");
      newSocket.off("user-status-changed");
      newSocket.disconnect();
      setSocketReady(false);
      setSocket(null);
    };
  }, [token]);

  useEffect(() => {
    if (socket && socketReady && userId) {
      socket.emit("join-user", userId);
      log("Emitted join-user with ID:", { userId });
    }
  }, [socket, socketReady, userId]);

  useEffect(() => {
    const handleLoginSuccess = () => {
      const storedToken = localStorage.getItem("token");
      setToken(storedToken);
      initializeAuth();
    };

    window.addEventListener("login-success", handleLoginSuccess);
    return () => {
      window.removeEventListener("login-success", handleLoginSuccess);
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{ socket, socketReady, userId, onlineUsers, setOnlineUsers, joinWorkspaceRoom }}
    >
      {children}
    </SocketContext.Provider>
  );
};