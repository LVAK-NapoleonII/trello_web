import { useState, useEffect, useContext, useCallback } from "react";
import {
  Button,
  Typography,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tooltip,
  Box,
} from "@mui/material";
import {
  AddCard as AddCardIcon,
  DeleteForever as DeleteForeverIcon,
  DragHandle as DragHandleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Pix as PixIcon,
} from "@mui/icons-material";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import { toast } from "react-toastify";
import { SocketContext } from "../../../../../context/SocketContext";
import ListCards from "./ListCards/ListCards";
import CreateCardDialog from "./ListCards/Cards/CreateCardDialog";
import EditColumnTitleDialog from "./EditColumnTitleDialog";
// Constants
const COLUMN_HEADER_HEIGHT = "56px";
const COLUMN_FOOTER_HEIGHT = "56px";
const API_BASE_URL = "http://localhost:5000/api";

function Column({
  column,
  setColumns,
  boardId,
  initialExpanded = true,
  boardMembers,
  setBoardMembers,
  predictedPosition,
  fetchCards,
}) {
  const { socket, socketReady } = useContext(SocketContext);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // State
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openEditTitleDialog, setOpenEditTitleDialog] = useState(false);
  const [openCreateCardDialog, setOpenCreateCardDialog] = useState(false);
  const [newTitle, setNewTitle] = useState(column.title);
  const [refreshCards, setRefreshCards] = useState(false);
  const [loading, setLoading] = useState({
    editTitle: false,
    deleteColumn: false,
  });

  // DnD
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column._id,
    data: { column, listId: column._id, type: "Column", isExpanded },
  });

  const { isOver, setNodeRef: setDroppableNodeRef } = useDroppable({
    id: column._id,
    data: { type: "Column" },
  });

  // Styles
  const dndKitColumnStyles = {
    transform: CSS.Translate.toString(transform),
    transition: transition || "transform 0.2s ease, opacity 0.2s ease",
    height: "100%",
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const getColumnStyles = () => ({
    minWidth: "350px",
    maxWidth: "400px",
    ml: 2,
    borderRadius: "12px",
    bgcolor: isOver
      ? isDarkMode
        ? "rgba(255,255,255,0.05)"
        : theme.palette.grey[100]
      : isDarkMode
        ? "#2a2a3d"
        : "#f4f5f7",
    height: isExpanded ? "fit-content" : COLUMN_HEADER_HEIGHT,
    maxHeight: isExpanded ? `calc(100vh - 100px)` : COLUMN_HEADER_HEIGHT,
    boxShadow: isDarkMode ? "0 4px 12px rgba(0,0,0,0.4)" : theme.shadows[3],
    display: "flex",
    flexDirection: "column",
    transition: "height 0.3s ease, box-shadow 0.2s ease",
    overflow: "hidden",
  });

  // Utility
  const getToken = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");
    return token;
  }, []);

  const normalizeCard = useCallback(
    (card) => ({
      _id: card._id || new Date().toISOString(),
      title: card.title || "Untitled Card",
      description: card.description || "",
      list: card.list || column._id,
      board: card.board || boardId,
      members: Array.isArray(card.members)
        ? card.members.map((m) => ({
          _id: m._id || "unknown",
          fullName: m.fullName || m.email || "Unknown User",
          avatar: m.avatar || "",
          email: m.email || "",
        }))
        : [],
      comments: Array.isArray(card.comments)
        ? card.comments.map((c) => ({
          ...c,
          user: {
            _id: c.user?._id || "unknown",
            fullName: c.user?.fullName || c.user?.email || "Unknown User",
            avatar: c.user?.avatar || "",
            email: c.user?.email || "",
          },
        }))
        : [],
      notes: Array.isArray(card.notes)
        ? card.notes.map((n) => ({
          ...n,
          createdBy: {
            _id: n.createdBy?._id || "unknown",
            fullName: n.createdBy?.fullName || n.createdBy?.email || "Unknown User",
            avatar: n.createdBy?.avatar || "",
            email: n.createdBy?.email || "",
          },
        }))
        : [],
      checklists: Array.isArray(card.checklists)
        ? card.checklists.map((cl) => ({
          _id: cl._id || new Date().toISOString(),
          title: cl.title || "Untitled Checklist",
          items: Array.isArray(cl.items)
            ? cl.items.map((item) => ({
              _id: item._id || new Date().toISOString(),
              text: item.text || "",
              completed: !!item.completed,
              createdAt: item.createdAt || new Date().toISOString(),
            }))
            : [],
        }))
        : [],
      completed: !!card.completed,
      createdAt: card.createdAt || new Date().toISOString(),
    }),
    [boardId, column._id]
  );

  // === HANDLERS ===
  const handleMenuOpen = useCallback((e) => setAnchorEl(e.currentTarget), []);
  const handleMenuClose = useCallback(() => setAnchorEl(null), []);

  const handleToggleExpand = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    setColumns((prev) =>
      prev.map((col) =>
        col._id === column._id ? { ...col, isExpanded: newExpanded } : col
      )
    );
  }, [isExpanded, setColumns, column._id]);

  const handleOpenEdit = useCallback(() => {
    setNewTitle(column.title);
    setOpenEditTitleDialog(true);
  }, [column.title]);

  const handleCloseEdit = useCallback(() => {
    setOpenEditTitleDialog(false);
  }, []);

  const handleSaveTitle = useCallback(async () => {
    if (!newTitle.trim()) {
      toast.error("Tiêu đề cột không được để trống!");
      return;
    }

    setLoading((prev) => ({ ...prev, editTitle: true }));
    try {
      const token = getToken();
      const { data } = await axios.put(
        `${API_BASE_URL}/lists/${column._id}`,
        { title: newTitle.trim(), version: column.version },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setColumns((prev) =>
        prev.map((c) => (c._id === column._id ? { ...c, title: newTitle } : c))
      );

      if (socket && socketReady) {
        socket.emit("list-updated", { boardId, list: data });
      }

      toast.success("Cập nhật tiêu đề cột thành công!");
      handleCloseEdit();
    } catch (err) {
      console.error("Error updating column title:", err);
      toast.error("Lỗi khi cập nhật tiêu đề cột!");
    } finally {
      setLoading((prev) => ({ ...prev, editTitle: false }));
    }
  }, [newTitle, column._id, boardId, socket, socketReady, setColumns, getToken, handleCloseEdit]);

  const handleDeleteColumn = useCallback(async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa cột này?")) return;

    setLoading((prev) => ({ ...prev, deleteColumn: true }));
    try {
      const token = getToken();
      await axios.delete(`${API_BASE_URL}/lists/${column._id}`, {
        data: { version: column.version },
        headers: { Authorization: `Bearer ${token}` },
      });

      setColumns((prev) => prev.filter((c) => c._id !== column._id));

      if (socket && socketReady) {
        socket.emit("list-deleted", { boardId, listId: column._id });
      }
      toast.success("Xóa cột thành công!");
    } catch (err) {
      console.error("Error deleting column:", err);
      toast.error("Lỗi khi xóa cột!");
    } finally {
      setLoading((prev) => ({ ...prev, deleteColumn: false }));
    }
  }, [socket, socketReady, boardId, column._id, setColumns, getToken]);

  // === SOCKET EFFECTS ===
  useEffect(() => {
    if (!socket || !socketReady || !boardId) return;

    socket.emit("join-board", { boardId });

    const handleCardCreated = ({ listId, card }) => {
      if (listId !== column._id) return;
      setColumns((prev) =>
        prev.map((col) =>
          col._id === listId
            ? { ...col, cards: [...(col.cards || []), normalizeCard(card)] }
            : col
        )
      );
      setRefreshCards((prev) => !prev);
      toast.info("Thẻ mới đã được thêm vào cột.");
    };

    const handleListUpdated = ({ list }) => {
      if (list._id !== column._id) return;
      setColumns((prev) =>
        prev.map((col) =>
          col._id === list._id
            ? { ...col, title: list.title, cards: list.cards?.map(normalizeCard) || col.cards }
            : col
        )
      );
      setNewTitle(list.title);
      toast.info("Tiêu đề cột đã được cập nhật.");
    };

    const handleListDeleted = ({ listId }) => {
      if (listId !== column._id) return;
      setColumns((prev) => prev.filter((col) => col._id !== listId));
      toast.info("Cột đã được xóa.");
    };

    socket.on("card-created", handleCardCreated);
    socket.on("list-updated", handleListUpdated);
    socket.on("list-deleted", handleListDeleted);

    return () => {
      socket.off("card-created", handleCardCreated);
      socket.off("list-updated", handleListUpdated);
      socket.off("list-deleted", handleListDeleted);
      socket.emit("leave-board", { boardId });
    };
  }, [socket, socketReady, boardId, column._id, setColumns, normalizeCard]);

  // === RENDER ===
  return (
    <>
      {/* CỘT CHÍNH */}
      <div ref={setNodeRef} style={dndKitColumnStyles} {...attributes}>
        <Box ref={setDroppableNodeRef} {...listeners} sx={getColumnStyles()}>
          {/* HEADER */}
          <Box
            sx={{
              height: COLUMN_HEADER_HEIGHT,
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: isExpanded ? `1px solid ${theme.palette.divider}` : "none",
              flexShrink: 0,
            }}
          >
            <Typography
              variant="h6"
              onClick={handleOpenEdit}
              sx={{
                fontWeight: 600,
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {column.title}
            </Typography>
            <Box>
              <Tooltip title={isExpanded ? "Thu gọn" : "Mở rộng"}>
                <span>
                  {isExpanded ? (
                    <ExpandMoreIcon onClick={handleToggleExpand} sx={{ cursor: "pointer" }} />
                  ) : (
                    <ExpandLessIcon onClick={handleToggleExpand} sx={{ cursor: "pointer" }} />
                  )}
                </span>
              </Tooltip>
              <Tooltip title="Tùy chọn">
                <span>
                  <PixIcon onClick={handleMenuOpen} sx={{ cursor: "pointer" }} />
                </span>
              </Tooltip>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={() => setOpenCreateCardDialog(true)}>
                  <ListItemIcon><AddCardIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Thêm thẻ mới</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleOpenEdit}>
                  <ListItemIcon><AddCardIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Sửa tiêu đề cột</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleDeleteColumn}>
                  <ListItemIcon><DeleteForeverIcon fontSize="small" color="error" /></ListItemIcon>
                  <ListItemText>Xóa cột này</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          </Box>

          {/* NỘI DUNG */}
          {isExpanded && (
            <>
              <Box sx={{ flex: 1, overflowY: "auto", px: 1, py: 2 }}>
                <ListCards
                  listId={column._id}
                  cards={column.cards || []}
                  socket={socket}
                  socketReady={socketReady}
                  boardId={boardId}
                  setColumns={setColumns}
                  boardMembers={boardMembers}
                  setBoardMembers={setBoardMembers}
                  predictedPosition={predictedPosition}
                />
              </Box>

              {/* FOOTER */}
              <Box
                sx={{
                  height: COLUMN_FOOTER_HEIGHT,
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: `1px solid ${theme.palette.divider}`,
                  flexShrink: 0,
                }}
              >
                <Button
                  startIcon={<AddCardIcon />}
                  onClick={() => setOpenCreateCardDialog(true)}
                  variant="contained"
                  size="small"
                >
                  Thêm thẻ mới
                </Button>
                <Tooltip title="Kéo để di chuyển cột">
                  <DragHandleIcon sx={{ cursor: "grab" }} className="drag-handle" />
                </Tooltip>
              </Box>
            </>
          )}
        </Box>
      </div>

      {/* DIALOG TÁCH RIÊNG – KHÔNG RE-RENDER CỘT */}
      <EditColumnTitleDialog
        open={openEditTitleDialog}
        onClose={handleCloseEdit}
        title={newTitle}
        onTitleChange={setNewTitle}
        onSave={handleSaveTitle}
        loading={loading.editTitle}
      />

      <CreateCardDialog
        open={openCreateCardDialog}
        onClose={() => setOpenCreateCardDialog(false)}
        columnId={column._id}
        boardId={boardId}
        setColumns={setColumns}
        socket={socket}
        socketReady={socketReady}
      />
    </>
  );
}

export default Column;