import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PeopleIcon from "@mui/icons-material/People";
import LockIcon from "@mui/icons-material/Lock";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import { toast } from "react-toastify";
import { SocketContext } from "../../../context/SocketContext";

const isDarkColor = (hexColor) => {
  if (!hexColor) return false;
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 140;
};

const BoardItem = ({ board, onUpdate, onDelete }) => {
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState(board.title);
  const [editDescription, setEditDescription] = useState(
    board.description || ""
  );
  const [editVisibility, setEditVisibility] = useState(board.visibility);

  const textColor = useMemo(() => {
    const isDark = isDarkColor(board.background);
    if (isDarkMode && !board.background) {
      return "#e0e0e0";
    }
    return isDark ? "#fff" : "#333";
  }, [board.background, isDarkMode]);

  const handleBoardClick = () => {
    navigate(`/workspace/${board.workspace}/board/${board._id}`);
  };

  const handleOpenEditDialog = (e) => {
    e.stopPropagation();
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditTitle(board.title);
    setEditDescription(board.description || "");
    setEditVisibility(board.visibility);
  };

  const handleUpdateBoard = async () => {
    if (!editTitle.trim()) {
      toast.error("Tiêu đề bảng không được để trống!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/boards/${board._id}`,
        {
          title: editTitle,
          description: editDescription,
          visibility: editVisibility,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      socket.emit("boardUpdated", response.data);
      onUpdate(response.data);
      handleCloseEditDialog();
      toast.success("Cập nhật bảng thành công!");
    } catch (err) {
      console.error("Lỗi cập nhật board:", err.response?.data || err.message);
      toast.error(
        `Có lỗi xảy ra khi cập nhật bảng: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  const handleDeleteBoard = async (e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/boards/${board._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      socket.emit("board-deleted", { boardId: board._id });
      onDelete(board._id);
      toast.success("Xóa bảng thành công!");
    } catch (err) {
      console.error("Lỗi xóa board:", err.response?.data || err.message);
      toast.error(
        `Có lỗi xảy ra khi xóa bảng: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  return (
    <>
      <Box
        sx={{
          bgcolor: board.background || (isDarkMode ? "#3A3A50" : "#0984e3"),
          p: 3,
          borderRadius: 3,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 280,
          height: 180,
          boxShadow: isDarkMode
            ? "0 4px 12px rgba(0,0,0,0.3)"
            : "0 4px 12px rgba(0,0,0,0.1)",
          border: isDarkMode ? "1px solid #444" : "none",
          position: "relative",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: isDarkMode
              ? "0 8px 24px rgba(0,0,0,0.4)"
              : "0 8px 24px rgba(0,0,0,0.15)",
          },
        }}
        onClick={handleBoardClick}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{
            color: textColor,
            wordWrap: "break-word",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
            lineHeight: 1.3,
          }}
        >
          {board.title}
        </Typography>
        {board.description && (
          <Typography
            variant="body2"
            sx={{
              color: textColor,
              opacity: 0.85,
              fontSize: "0.9rem",
              mt: 1,
              wordWrap: "break-word",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 3,
              overflow: "hidden",
              lineHeight: 1.4,
            }}
          >
            {board.description}
          </Typography>
        )}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mt: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip
              title={board.visibility === "public" ? "Công khai" : "Riêng tư"}
            >
              {board.visibility === "public" ? (
                <PeopleIcon
                  sx={{
                    color: textColor,
                    fontSize: 18,
                    bgcolor: isDarkMode
                      ? "rgba(255, 255, 255, 0.3)"
                      : "rgba(255, 255, 255, 0.2)",
                    borderRadius: "50%",
                    p: 0.5,
                  }}
                />
              ) : (
                <LockIcon
                  sx={{
                    color: textColor,
                    fontSize: 18,
                    bgcolor: isDarkMode
                      ? "rgba(255, 255, 255, 0.3)"
                      : "rgba(255, 255, 255, 0.2)",
                    borderRadius: "50%",
                    p: 0.5,
                  }}
                />
              )}
            </Tooltip>
            <Typography
              variant="caption"
              sx={{ color: textColor, fontWeight: "medium" }}
            >
              {board.visibility === "public" ? "Công khai" : "Riêng tư"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              sx={{
                color: textColor,
                bgcolor: isDarkMode
                  ? "rgba(255, 255, 255, 0.3)"
                  : "rgba(255, 255, 255, 0.2)",
                "&:hover": {
                  bgcolor: isDarkMode
                    ? "rgba(255, 255, 255, 0.4)"
                    : "rgba(255, 255, 255, 0.3)",
                },
                p: 0.8,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleBoardClick();
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
            <IconButton
              sx={{
                color: textColor,
                bgcolor: isDarkMode
                  ? "rgba(255, 255, 255, 0.3)"
                  : "rgba(255, 255, 255, 0.2)",
                "&:hover": {
                  bgcolor: isDarkMode
                    ? "rgba(255, 255, 255, 0.4)"
                    : "rgba(255, 255, 255, 0.3)",
                },
                p: 0.8,
              }}
              onClick={handleOpenEditDialog}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              sx={{
                color: textColor,
                bgcolor: isDarkMode
                  ? "rgba(255, 255, 255, 0.3)"
                  : "rgba(255, 255, 255, 0.2)",
                "&:hover": {
                  bgcolor: isDarkMode
                    ? "rgba(255, 255, 255, 0.4)"
                    : "rgba(255, 255, 255, 0.3)",
                },
                p: 0.8,
              }}
              onClick={handleDeleteBoard}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle>Chỉnh sửa bảng</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tiêu đề bảng"
            fullWidth
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Mô tả"
            fullWidth
            multiline
            rows={3}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={editVisibility}
              label="Trạng thái"
              onChange={(e) => setEditVisibility(e.target.value)}
            >
              <MenuItem value="public">Công khai</MenuItem>
              <MenuItem value="private">Riêng tư</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Hủy</Button>
          <Button onClick={handleUpdateBoard} variant="contained">
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BoardItem;
