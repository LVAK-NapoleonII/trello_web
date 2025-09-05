import { useState, useEffect, useContext } from "react";
import { Box, Typography, Fade, useTheme, Skeleton } from "@mui/material";
import { Dashboard as DashboardIcon } from "@mui/icons-material";
import BoardItem from "./BoardItem/BoardItem";
import { SocketContext } from "../../context/SocketContext";

const BoardList = ({ boards: initialBoards = [], searchValue = "", onUpdate, onDelete, loading = false }) => {
  const { socket, socketReady } = useContext(SocketContext);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [boards, setBoards] = useState(initialBoards);

  useEffect(() => {
    setBoards(initialBoards);
  }, [initialBoards]);

  useEffect(() => {
    if (!socket || !socketReady) return;

    const userId = localStorage.getItem("userId");
    if (userId) socket.emit("join", userId);

    const socketHandlers = {
      "board-created": (data) => {
        setBoards((prev) => {
          if (!prev.some((b) => b._id === data.board._id)) return [...prev, data.board];
          return prev;
        });
        onUpdate?.(data.board);
      },
      "boardUpdated": (data) => {
        setBoards((prev) => prev.map((board) => (board._id === data._id ? data : board)));
        onUpdate?.(data);
      },
      "board-deleted": (data) => {
        setBoards((prev) => prev.filter((board) => board._id !== data.boardId));
        onDelete?.(data.boardId);
      },
    };

    Object.entries(socketHandlers).forEach(([event, handler]) => socket.on(event, handler));
    return () => Object.entries(socketHandlers).forEach(([event, handler]) => socket.off(event, handler));
  }, [socket, socketReady, onUpdate, onDelete]);

  const filteredBoards = boards.filter((board) => board?.title?.toLowerCase().includes(searchValue.toLowerCase()));
  const scrollbarStyles = {
    "&::-webkit-scrollbar": { height: "8px" },
    "&::-webkit-scrollbar-track": { background: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", borderRadius: "10px" },
    "&::-webkit-scrollbar-thumb": { background: isDarkMode ? "#667EEA" : "#3182CE", borderRadius: "10px", "&:hover": { background: isDarkMode ? "#7F9CF5" : "#2B6CB0" } },
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", gap: 3, overflowX: "auto", pb: 2, ...scrollbarStyles }}>
        {[1, 2, 3].map((item) => (
          <Box key={item} sx={{ minWidth: 320, flexShrink: 0, height: 200, bgcolor: isDarkMode ? "#2D3748" : "#ffffff", borderRadius: "16px", p: 3, border: isDarkMode ? "1px solid #4A5568" : "1px solid #E2E8F0" }}>
            <Skeleton variant="text" width="70%" height={28} sx={{ bgcolor: isDarkMode ? "#4A5568" : "#E2E8F0" }} />
            <Skeleton variant="text" width="100%" height={20} sx={{ mt: 1, bgcolor: isDarkMode ? "#4A5568" : "#E2E8F0" }} />
            <Skeleton variant="text" width="85%" height={20} sx={{ mt: 1, bgcolor: isDarkMode ? "#4A5568" : "#E2E8F0" }} />
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
              <Skeleton variant="text" width="30%" height={16} sx={{ bgcolor: isDarkMode ? "#4A5568" : "#E2E8F0" }} />
              <Box sx={{ display: "flex", gap: 1 }}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="circular" width={32} height={32} sx={{ bgcolor: isDarkMode ? "#4A5568" : "#E2E8F0" }} />
                ))}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  if (filteredBoards.length === 0 && searchValue) {
    return (
      <Box sx={{ textAlign: "center", py: 8, bgcolor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", borderRadius: "20px", border: `2px dashed ${isDarkMode ? "#4A5568" : "#E2E8F0"}` }}>
        <DashboardIcon sx={{ fontSize: 64, color: isDarkMode ? "#4A5568" : "#CBD5E0", mb: 2 }} />
        <Typography variant="h6" sx={{ color: isDarkMode ? "#A0AEC0" : "#718096", mb: 1, fontWeight: 600 }}>
          Không tìm thấy bảng nào
        </Typography>
        <Typography variant="body2" sx={{ color: isDarkMode ? "#718096" : "#A0AEC0" }}>
          Không có bảng nào phù hợp với từ khóa "{searchValue}"
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", gap: 3, overflowX: "auto", pb: 2, ...scrollbarStyles }}>
      {filteredBoards.map((board, index) => (
        <Box key={board._id} sx={{ minWidth: 320, flexShrink: 0 }}>
          <Fade in timeout={300} style={{ transitionDelay: `${index * 50}ms` }}>
            <div>
              <BoardItem board={board} onUpdate={onUpdate} onDelete={onDelete} />
            </div>
          </Fade>
        </Box>
      ))}
    </Box>
  );
};

export default BoardList;