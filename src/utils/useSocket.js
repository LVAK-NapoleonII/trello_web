import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // Kết nối tới server

const useSocket = (boardId) => {
  const [boardData, setBoardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!boardId) return;

    socket.emit("joinBoard", boardId);

    socket.on("boardUpdated", (data) => {
      setBoardData(data);
      setLoading(false); // Dừng loading khi nhận được dữ liệu
    });

    return () => {
      socket.off("boardUpdated"); // Xóa listener khi unmount
    };
  }, [boardId]);

  const updateBoard = (data) => {
    socket.emit("updateBoard", boardId, data);
  };

  return { boardData, updateBoard, loading };
};

export default useSocket;
