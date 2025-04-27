import { useState, useEffect, useContext, useCallback } from "react";
import { Button, Typography } from "@mui/material";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import AddCardIcon from "@mui/icons-material/AddCard";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import PixIcon from "@mui/icons-material/Pix";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import ListCards from "./ListCards/ListCards";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { toast } from "react-toastify";
import { SocketContext } from "../../../../../context/SocketContext";
import { useTheme } from "@mui/material/styles";

function Column({
  column,
  setColumns,
  boardId,
  onDragStart,
  onDragEnd,
  initialExpanded = true,
  boardMembers,
  setBoardMembers,
}) {
  const { socket, socketReady } = useContext(SocketContext);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [openEditTitleDialog, setOpenEditTitleDialog] = useState(false);
  const [newTitle, setNewTitle] = useState(column.title);
  const [openCreateCardDialog, setOpenCreateCardDialog] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardDescription, setNewCardDescription] = useState("");
  const [loading, setLoading] = useState({
    createCard: false,
    editTitle: false,
    deleteColumn: false,
  });
  const [refreshCards, setRefreshCards] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column._id,
    data: { ...column, type: "Column", isExpanded },
  });

  const { isOver, setNodeRef: setDroppableNodeRef } = useDroppable({
    id: column._id,
    data: { type: "Column" },
  });

  const dndKitColumnStyles = {
    transform: CSS.Translate.toString(transform),
    transition: transition || "transform 0.2s ease, opacity 0.2s ease",
    height: "100%",
    opacity: isDragging ? 0.8 : 1,
    transform: isDragging
      ? `${CSS.Translate.toString(transform)} scale(1.05)`
      : CSS.Translate.toString(transform),
    zIndex: isDragging ? 10 : 1,
  };

  const COLUMN_HEADER_HEIGHT = "56px";
  const COLUMN_FOOTER_HEIGHT = "56px";
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Normalize card data to ensure consistency
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
              fullName:
                n.createdBy?.fullName || n.createdBy?.email || "Unknown User",
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

  // Join the board's socket room and handle real-time updates
  useEffect(() => {
    if (!socket || !socketReady || !boardId) {
      console.warn("Column: Socket not available, not ready, or no boardId", {
        socket: !!socket,
        socketReady,
        boardId,
      });
      toast.warn("Không thể kết nối thời gian thực. Kiểm tra kết nối mạng!", {
        toastId: "socket-error-column",
      });
      return;
    }

    // Join the board's room
    socket.emit("join-board", { boardId });
    console.log("Column: Joined board room:", boardId);

    // Socket event handlers
    const socketHandlers = {
      "card-created": ({ listId, card }) => {
        console.log("Column: Received card-created:", { listId, card });
        if (listId === column._id) {
          setColumns((prevColumns) =>
            prevColumns.map((col) =>
              col._id === listId
                ? {
                    ...col,
                    cards: [...(col.cards || []), normalizeCard(card)],
                  }
                : col
            )
          );
          setRefreshCards((prev) => !prev);
          toast.info("Thẻ mới đã được thêm vào cột.");
        }
      },
      "list-updated": ({ list }) => {
        console.log("Column: Received list-updated:", { list });
        if (list._id === column._id) {
          setColumns((prevColumns) =>
            prevColumns.map((col) =>
              col._id === list._id
                ? {
                    ...col,
                    title: list.title,
                    cards: Array.isArray(list.cards)
                      ? list.cards.map(normalizeCard)
                      : col.cards,
                  }
                : col
            )
          );
          setNewTitle(list.title);
          toast.info("Tiêu đề cột đã được cập nhật.");
        }
      },
      "list-deleted": ({ listId }) => {
        console.log("Column: Received list-deleted:", { listId });
        if (listId === column._id) {
          setColumns((prevColumns) =>
            prevColumns.filter((col) => col._id !== listId)
          );
          toast.info("Cột đã được xóa.");
        }
      },
    };

    // Register socket event listeners
    Object.entries(socketHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Cleanup: Leave the room and remove listeners
    return () => {
      socket.emit("leave-board", { boardId });
      console.log("Column: Left board room:", boardId);
      Object.keys(socketHandlers).forEach((event) => {
        socket.off(event, socketHandlers[event]);
      });
    };
  }, [socket, socketReady, boardId, column._id, setColumns, normalizeCard]);

  const handleToggleExpand = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    setColumns((prevColumns) =>
      prevColumns.map((col) =>
        col._id === column._id ? { ...col, isExpanded: newExpanded } : col
      )
    );
  }, [isExpanded, setColumns, column._id]);

  const handleDeleteColumn = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa cột này?")) return;

    setLoading((prev) => ({ ...prev, deleteColumn: true }));

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token! Vui lòng đăng nhập lại.");
      }

      await axios.delete(`http://localhost:5000/api/lists/${column._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setColumns((prevColumns) =>
        prevColumns.filter((c) => c._id !== column._id)
      );

      if (socket && socketReady) {
        socket.emit("list-deleted", {
          boardId,
          listId: column._id,
        });
        console.log("Column: Emitted list-deleted:", {
          boardId,
          listId: column._id,
        });
      }
      toast.success("Xóa cột thành công!");
    } catch (err) {
      console.error("Column: Error deleting column:", {
        message: err.message,
        response: err.response?.data,
      });
      toast.error(
        `Có lỗi xảy ra khi xóa cột: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading((prev) => ({ ...prev, deleteColumn: false }));
    }
  };

  const handleEditTitle = async () => {
    if (!newTitle.trim()) {
      toast.error("Tiêu đề cột không được để trống!");
      return;
    }

    setLoading((prev) => ({ ...prev, editTitle: true }));

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token! Vui lòng đăng nhập lại.");
      }

      const response = await axios.put(
        `http://localhost:5000/api/lists/${column._id}`,
        { title: newTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setColumns((prevColumns) =>
        prevColumns.map((col) =>
          col._id === column._id ? { ...col, title: newTitle } : col
        )
      );

      if (socket && socketReady) {
        socket.emit("list-updated", {
          boardId,
          list: response.data,
        });
        console.log("Column: Emitted list-updated:", {
          boardId,
          list: response.data,
        });
      }
      toast.success("Cập nhật tiêu đề cột thành công!");
      setOpenEditTitleDialog(false);
    } catch (err) {
      console.error("Column: Error updating column title:", {
        message: err.message,
        response: err.response?.data,
      });
      toast.error(
        `Có lỗi xảy ra khi cập nhật tiêu đề cột: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading((prev) => ({ ...prev, editTitle: false }));
    }
  };

  const handleCreateCard = async () => {
    if (!newCardTitle.trim()) {
      toast.error("Tiêu đề thẻ không được để trống!");
      return;
    }

    if (!boardId) {
      toast.error("Không tìm thấy boardId! Vui lòng kiểm tra lại.");
      return;
    }

    if (!column._id) {
      toast.error("Không tìm thấy listId! Vui lòng kiểm tra lại.");
      return;
    }

    setLoading((prev) => ({ ...prev, createCard: true }));

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token! Vui lòng đăng nhập lại.");
      }

      const response = await axios.post(
        "http://localhost:5000/api/cards",
        {
          title: newCardTitle,
          description: newCardDescription,
          list: column._id,
          board: boardId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newCard = normalizeCard(response.data);

      // Update local state for the current client
      setColumns((prevColumns) =>
        prevColumns.map((col) =>
          col._id === column._id
            ? { ...col, cards: [...(col.cards || []), newCard] }
            : col
        )
      );

      if (socket && socketReady) {
        socket.emit("card-created", {
          boardId,
          listId: column._id,
          card: newCard,
        });
        console.log("Column: Emitted card-created:", {
          boardId,
          listId: column._id,
          card: newCard,
        });
      }

      toast.success("Tạo thẻ thành công!");
      setOpenCreateCardDialog(false);
      setNewCardTitle("");
      setNewCardDescription("");
      setRefreshCards((prev) => !prev);
    } catch (err) {
      console.error("Column: Error creating card:", {
        message: err.message,
        response: err.response?.data,
      });
      toast.error(
        `Có lỗi xảy ra khi tạo thẻ: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading((prev) => ({ ...prev, createCard: false }));
    }
  };

  return (
    <>
      <div ref={setNodeRef} style={dndKitColumnStyles} {...attributes}>
        <Box
          ref={setDroppableNodeRef}
          {...listeners}
          sx={{
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
            maxHeight: isExpanded
              ? `calc(100vh - 100px)`
              : COLUMN_HEADER_HEIGHT,
            boxShadow: isDarkMode
              ? "0 4px 12px rgba(0,0,0,0.4)"
              : theme.shadows[3],
            display: "flex",
            flexDirection: "column",
            transition:
              "height 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease",
            "&:hover": {
              transform: isDragging ? "none" : "translateY(-4px)",
              boxShadow: isDarkMode
                ? "0 6px 16px rgba(0,0,0,0.5)"
                : theme.shadows[5],
            },
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              height: COLUMN_HEADER_HEIGHT,
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: isExpanded
                ? (theme) =>
                    `1px solid ${
                      isDarkMode
                        ? theme.palette.grey[700]
                        : theme.palette.grey[300]
                    }`
                : "none",
              flexShrink: 0,
              bgcolor: isDarkMode
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.02)",
              borderTopLeftRadius: "12px",
              borderTopRightRadius: "12px",
              borderBottomLeftRadius: isExpanded ? 0 : "12px",
              borderBottomRightRadius: isExpanded ? 0 : "12px",
            }}
          >
            <Typography
              variant="h6"
              onClick={() => setOpenEditTitleDialog(true)}
              sx={{
                fontWeight: 600,
                fontSize: "1.25rem",
                cursor: "pointer",
                color: isDarkMode
                  ? theme.palette.grey[200]
                  : theme.palette.text.primary,
                background: isDarkMode
                  ? `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                  : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              {column?.title}
            </Typography>
            <Box>
              <Tooltip title={isExpanded ? "Thu gọn cột" : "Mở rộng cột"}>
                <span>
                  {isExpanded ? (
                    <ExpandMoreIcon
                      sx={{
                        color: isDarkMode
                          ? theme.palette.grey[400]
                          : theme.palette.text.secondary,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          color: theme.palette.primary.main,
                          transform: "scale(1.2)",
                        },
                      }}
                      onClick={handleToggleExpand}
                    />
                  ) : (
                    <ExpandLessIcon
                      sx={{
                        color: isDarkMode
                          ? theme.palette.grey[400]
                          : theme.palette.text.secondary,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          color: theme.palette.primary.main,
                          transform: "scale(1.2)",
                        },
                      }}
                      onClick={handleToggleExpand}
                    />
                  )}
                </span>
              </Tooltip>
              <Tooltip title="Tùy chọn khác">
                <span>
                  <PixIcon
                    sx={{
                      color: isDarkMode
                        ? theme.palette.grey[400]
                        : theme.palette.text.secondary,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        color: theme.palette.primary.main,
                        transform: "scale(1.2)",
                      },
                    }}
                    id="basic-column-dropdown"
                    aria-controls={
                      open ? "basic-menu-column-dropdown" : undefined
                    }
                    aria-haspopup="true"
                    aria-expanded={open ? "true" : undefined}
                    onClick={handleClick}
                  />
                </span>
              </Tooltip>
              <Menu
                id="basic-menu-column"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                  "aria-labelledby": "basic-column-dropdown",
                }}
                sx={{
                  "& .MuiPaper-root": {
                    borderRadius: "8px",
                    boxShadow: isDarkMode
                      ? "0 4px 16px rgba(0,0,0,0.5)"
                      : theme.shadows[4],
                    bgcolor: isDarkMode
                      ? "#3a3a50"
                      : theme.palette.background.paper,
                    minWidth: "200px",
                    transition: "all 0.2s ease",
                  },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <MenuItem
                  onClick={() => setOpenCreateCardDialog(true)}
                  sx={{
                    "&:hover": {
                      bgcolor: isDarkMode
                        ? theme.palette.grey[700]
                        : theme.palette.grey[100],
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  <ListItemIcon>
                    <AddCardIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primaryTypographyProps={{
                      fontWeight: 500,
                      color: isDarkMode
                        ? theme.palette.grey[200]
                        : theme.palette.text.primary,
                    }}
                  >
                    Thêm thẻ mới
                  </ListItemText>
                </MenuItem>
                <MenuItem
                  onClick={() => setOpenEditTitleDialog(true)}
                  sx={{
                    "&:hover": {
                      bgcolor: isDarkMode
                        ? theme.palette.grey[700]
                        : theme.palette.grey[100],
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  <ListItemIcon>
                    <AddCardIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primaryTypographyProps={{
                      fontWeight: 500,
                      color: isDarkMode
                        ? theme.palette.grey[200]
                        : theme.palette.text.primary,
                    }}
                  >
                    Sửa tiêu đề cột
                  </ListItemText>
                </MenuItem>
                <Divider
                  sx={{
                    bgcolor: isDarkMode
                      ? theme.palette.grey[700]
                      : theme.palette.grey[300],
                  }}
                />
                <MenuItem
                  onClick={handleDeleteColumn}
                  sx={{
                    "&:hover": {
                      bgcolor: isDarkMode
                        ? theme.palette.grey[700]
                        : theme.palette.grey[100],
                      color: theme.palette.error.main,
                    },
                  }}
                >
                  <ListItemIcon>
                    <DeleteForeverIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primaryTypographyProps={{
                      fontWeight: 500,
                      color: isDarkMode
                        ? theme.palette.grey[200]
                        : theme.palette.text.primary,
                    }}
                  >
                    Xóa cột này
                  </ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          </Box>

          {isExpanded && (
            <>
              <Box
                sx={{
                  maxHeight: `calc(100vh - ${COLUMN_HEADER_HEIGHT} - ${COLUMN_FOOTER_HEIGHT} - 32px)`,
                  overflowY: "auto",
                  "&::-webkit-scrollbar": {
                    width: "8px",
                  },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: isDarkMode
                      ? "#3a3a50"
                      : theme.palette.grey[200],
                    borderRadius: "8px",
                    m: "0 4px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: isDarkMode
                      ? "#666"
                      : theme.palette.grey[400],
                    borderRadius: "8px",
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "#888"
                        : theme.palette.grey[500],
                    },
                  },
                  px: 1,
                  py: 2,
                }}
              >
                <ListCards
                  listId={column._id}
                  refresh={refreshCards}
                  setColumns={setColumns}
                  boardMembers={boardMembers}
                  setBoardMembers={setBoardMembers}
                  boardId={boardId}
                />
              </Box>

              <Box
                sx={{
                  height: COLUMN_FOOTER_HEIGHT,
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: (theme) =>
                    `1px solid ${
                      isDarkMode
                        ? theme.palette.grey[700]
                        : theme.palette.grey[300]
                    }`,
                  flexShrink: 0,
                  bgcolor: isDarkMode
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.02)",
                  borderBottomLeftRadius: "12px",
                  borderBottomRightRadius: "12px",
                }}
              >
                <Button
                  startIcon={<AddCardIcon />}
                  onClick={() => setOpenCreateCardDialog(true)}
                  disabled={loading.createCard}
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    color: theme.palette.primary.contrastText,
                    background: isDarkMode
                      ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                      : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    borderRadius: "8px",
                    px: 2,
                    py: 0.75,
                    boxShadow: isDarkMode
                      ? "0 2px 8px rgba(0,0,0,0.3)"
                      : theme.shadows[2],
                    transition: "all 0.2s ease",
                    "&:hover": {
                      background: isDarkMode
                        ? `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`
                        : `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                      transform: "scale(1.05)",
                      boxShadow: isDarkMode
                        ? "0 4px 12px rgba(0,0,0,0.4)"
                        : theme.shadows[3],
                    },
                    "&:disabled": {
                      background: theme.palette.grey[500],
                      color: theme.palette.grey[300],
                      boxShadow: "none",
                    },
                  }}
                >
                  {loading.createCard ? "Đang tạo..." : "Thêm thẻ mới"}
                </Button>
                <Tooltip title="Kéo để di chuyển">
                  <DragHandleIcon
                    sx={{
                      cursor: "pointer",
                      color: isDarkMode
                        ? theme.palette.grey[400]
                        : theme.palette.text.secondary,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        color: theme.palette.primary.main,
                        transform: "scale(1.2)",
                      },
                    }}
                  />
                </Tooltip>
              </Box>
            </>
          )}
        </Box>
      </div>

      <Dialog
        open={openCreateCardDialog}
        onClose={() => setOpenCreateCardDialog(false)}
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "12px",
            boxShadow: isDarkMode
              ? "0 4px 16px rgba(0,0,0,0.5)"
              : theme.shadows[5],
            bgcolor: isDarkMode ? "#2a2a3d" : theme.palette.background.paper,
            color: isDarkMode
              ? theme.palette.grey[200]
              : theme.palette.text.primary,
            p: 2,
            minWidth: { xs: "90%", sm: "400px" },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            fontSize: "1.25rem",
            color: isDarkMode
              ? theme.palette.grey[100]
              : theme.palette.text.primary,
          }}
        >
          Tạo thẻ mới
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tiêu đề thẻ"
            fullWidth
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            disabled={loading.createCard}
            sx={{
              mt: 1,
              "& .MuiInputBase-root": {
                borderRadius: "8px",
                bgcolor: isDarkMode
                  ? "rgba(255, 255, 255, 0.05)"
                  : theme.palette.background.default,
                color: isDarkMode
                  ? theme.palette.grey[200]
                  : theme.palette.text.primary,
                transition: "all 0.2s ease",
              },
              "& .MuiInputLabel-root": {
                fontWeight: 500,
                color: isDarkMode
                  ? theme.palette.grey[400]
                  : theme.palette.text.secondary,
                "&.Mui-focused": {
                  color: theme.palette.primary.main,
                },
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: isDarkMode
                  ? theme.palette.grey[600]
                  : theme.palette.grey[300],
                transition: "border-color 0.2s ease",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: isDarkMode
                  ? theme.palette.grey[500]
                  : theme.palette.primary.main,
              },
              "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.primary.main,
                borderWidth: "2px",
              },
            }}
          />
          <TextField
            margin="dense"
            label="Mô tả"
            fullWidth
            multiline
            rows={3}
            value={newCardDescription}
            onChange={(e) => setNewCardDescription(e.target.value)}
            disabled={loading.createCard}
            sx={{
              mt: 2,
              "& .MuiInputBase-root": {
                borderRadius: "8px",
                bgcolor: isDarkMode
                  ? "rgba(255, 255, 255, 0.05)"
                  : theme.palette.background.default,
                color: isDarkMode
                  ? theme.palette.grey[200]
                  : theme.palette.text.primary,
                transition: "all 0.2s ease",
              },
              "& .MuiInputLabel-root": {
                fontWeight: 500,
                color: isDarkMode
                  ? theme.palette.grey[400]
                  : theme.palette.text.secondary,
                "&.Mui-focused": {
                  color: theme.palette.primary.main,
                },
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: isDarkMode
                  ? theme.palette.grey[600]
                  : theme.palette.grey[300],
                transition: "border-color 0.2s ease",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: isDarkMode
                  ? theme.palette.grey[500]
                  : theme.palette.primary.main,
              },
              "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.primary.main,
                borderWidth: "2px",
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenCreateCardDialog(false)}
            disabled={loading.createCard}
            sx={{
              color: isDarkMode
                ? theme.palette.grey[400]
                : theme.palette.text.secondary,
              fontWeight: 500,
              borderRadius: "8px",
              px: 2,
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: isDarkMode
                  ? theme.palette.grey[700]
                  : theme.palette.grey[100],
                transform: "scale(1.05)",
              },
              "&:disabled": {
                color: theme.palette.grey[600],
              },
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleCreateCard}
            variant="contained"
            disabled={loading.createCard}
            sx={{
              fontWeight: 500,
              borderRadius: "8px",
              px: 3,
              py: 0.75,
              background: isDarkMode
                ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              color: theme.palette.primary.contrastText,
              boxShadow: isDarkMode
                ? "0 2px 8px rgba(0,0,0,0.3)"
                : theme.shadows[2],
              transition: "all 0.2s ease",
              "&:hover": {
                background: isDarkMode
                  ? `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`
                  : `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                transform: "scale(1.05)",
                boxShadow: isDarkMode
                  ? "0 4px 12px rgba(0,0,0,0.4)"
                  : theme.shadows[3],
              },
              "&:disabled": {
                background: theme.palette.grey[500],
                color: theme.palette.grey[300],
                boxShadow: "none",
              },
            }}
          >
            {loading.createCard ? "Đang tạo..." : "Tạo"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openEditTitleDialog}
        onClose={() => setOpenEditTitleDialog(false)}
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "12px",
            boxShadow: isDarkMode
              ? "0 4px 16px rgba(0,0,0,0.5)"
              : theme.shadows[5],
            bgcolor: isDarkMode ? "#2a2a3d" : theme.palette.background.paper,
            color: isDarkMode
              ? theme.palette.grey[200]
              : theme.palette.text.primary,
            p: 2,
            minWidth: { xs: "90%", sm: "400px" },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            fontSize: "1.25rem",
            color: isDarkMode
              ? theme.palette.grey[100]
              : theme.palette.text.primary,
          }}
        >
          Sửa tiêu đề cột
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tiêu đề cột"
            fullWidth
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            disabled={loading.editTitle}
            sx={{
              mt: 1,
              "& .MuiInputBase-root": {
                borderRadius: "8px",
                bgcolor: isDarkMode
                  ? "rgba(255, 255, 255, 0.05)"
                  : theme.palette.background.default,
                color: isDarkMode
                  ? theme.palette.grey[200]
                  : theme.palette.text.primary,
                transition: "all 0.2s ease",
              },
              "& .MuiInputLabel-root": {
                fontWeight: 500,
                color: isDarkMode
                  ? theme.palette.grey[400]
                  : theme.palette.text.secondary,
                "&.Mui-focused": {
                  color: theme.palette.primary.main,
                },
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: isDarkMode
                  ? theme.palette.grey[600]
                  : theme.palette.grey[300],
                transition: "border-color 0.2s ease",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: isDarkMode
                  ? theme.palette.grey[500]
                  : theme.palette.primary.main,
              },
              "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.primary.main,
                borderWidth: "2px",
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenEditTitleDialog(false)}
            disabled={loading.editTitle}
            sx={{
              color: isDarkMode
                ? theme.palette.grey[400]
                : theme.palette.text.secondary,
              fontWeight: 500,
              borderRadius: "8px",
              px: 2,
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: isDarkMode
                  ? theme.palette.grey[700]
                  : theme.palette.grey[100],
                transform: "scale(1.05)",
              },
              "&:disabled": {
                color: theme.palette.grey[600],
              },
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleEditTitle}
            variant="contained"
            disabled={loading.editTitle}
            sx={{
              fontWeight: 500,
              borderRadius: "8px",
              px: 3,
              py: 0.75,
              background: isDarkMode
                ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              color: theme.palette.primary.contrastText,
              boxShadow: isDarkMode
                ? "0 2px 8px rgba(0,0,0,0.3)"
                : theme.shadows[2],
              transition: "all 0.2s ease",
              "&:hover": {
                background: isDarkMode
                  ? `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`
                  : `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                transform: "scale(1.05)",
                boxShadow: isDarkMode
                  ? "0 4px 12px rgba(0,0,0,0.4)"
                  : theme.shadows[3],
              },
              "&:disabled": {
                background: theme.palette.grey[500],
                color: theme.palette.grey[300],
                boxShadow: "none",
              },
            }}
          >
            {loading.editTitle ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Column;
