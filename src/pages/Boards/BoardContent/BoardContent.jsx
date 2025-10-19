import { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { SocketContext } from "../../../context/SocketContext.jsx";
import Box from "@mui/material/Box";
import ListColumns from "./ListColumns/ListColumns";
import { cloneDeep } from "lodash";

function BoardContent({ board, boardMembers, setBoardMembers }) {
  const { socket, socketReady } = useContext(SocketContext);
  const [backgroundError, setBackgroundError] = useState(false);

  // Kiểm tra lỗi tải ảnh background
  useEffect(() => {
    if (board?.background && board.background.startsWith("http")) {
      const img = new Image();
      img.src = board.background;
      img.onload = () => setBackgroundError(false);
      img.onerror = () => setBackgroundError(true);
    } else {
      setBackgroundError(false);
    }
  }, [board?.background]);

  // Socket handlers cho member management
  useEffect(() => {
    if (!socket || !socketReady || !board?._id) return;

    socket.on("connect", () => {
      console.log("BoardContent: Socket connected");
      socket.emit("join-board", { boardId: board._id });
    });

    socket.on("member-invited", (data) => {
      if (data.board._id !== board._id) return;
      console.log("BoardContent: Received member-invited:", data);
      setBoardMembers(data.board.members || []);
      toast.info("Thành viên mới đã được thêm vào bảng.");
    });

    socket.on("member-deactivated", (data) => {
      if (data.boardId !== board._id) return;
      console.log("BoardContent: Received member-deactivated:", data);

      if (data.deactivatedUserId === localStorage.getItem("userId")) {
        toast.info("Bạn đã bị xóa khỏi bảng này!");
        // Có thể redirect về dashboard
      } else {
        setBoardMembers((prev) =>
          prev.map((member) =>
            member.user._id.toString() === data.deactivatedUserId
              ? { ...member, isActive: false }
              : member
          )
        );
        toast.info("Một thành viên đã bị xóa khỏi bảng.");
      }
    });

    return () => {
      socket.off("connect");
      socket.off("member-invited");
      socket.off("member-deactivated");
    };
  }, [socket, socketReady, board?._id, setBoardMembers]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "calc(100vh - 64px)",
        display: "flex",
        bgcolor: board?.background && !backgroundError && board.background.startsWith("http")
          ? "transparent"
          : (theme) => (theme.palette.mode === "dark" ? "#34495e" : "#1976d2"),
        backgroundImage:
          board?.background && !backgroundError && board.background.startsWith("http")
            ? `url(${board.background})`
            : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        p: "10px 0",
        position: "relative",
        overflowX: "auto",
        overflowY: "hidden",
        "&::-webkit-scrollbar": {
          height: "8px",
        },
        "&::-webkit-scrollbar-track": {
          background: (theme) =>
            theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
          borderRadius: "10px",
        },
        "&::-webkit-scrollbar-thumb": {
          background: (theme) =>
            theme.palette.mode === "dark" ? "#667EEA" : "#3182CE",
          borderRadius: "10px",
          "&:hover": {
            background: (theme) =>
              theme.palette.mode === "dark" ? "#7F9CF5" : "#2B6CB0",
          },
        },
      }}
    >
      {/* Background overlay */}
      {board?.background && board.background.startsWith("http") && (
        <>
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: (theme) =>
                theme.palette.mode === "dark" ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.4)",
              zIndex: 0,
            }}
          />
          <img
            src={board.background}
            alt="Board background"
            style={{ display: "none" }}
            onError={() => setBackgroundError(true)}
          />
        </>
      )}

      {/* Main content - ListColumns handles all DnD */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          height: "100%",
          width: "100%",
        }}
      >
        <ListColumns
          boardId={board?._id}
          boardMembers={boardMembers}
          setBoardMembers={setBoardMembers}
        />
      </Box>
    </Box>
  );
}

export default BoardContent;