import { useState, useContext, useMemo, useEffect } from "react";
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
  Chip,
  Fade,
  CircularProgress,
  Grid,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  People as PeopleIcon,
  Lock as LockIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Launch as LaunchIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import { toast } from "react-toastify";
import { SocketContext } from "../../../context/SocketContext";

const presetBackgrounds = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
  "https://images.unsplash.com/photo-1518655048521-f130df041f17",
  "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1",
  "https://images.unsplash.com/photo-1503262022798-6598733c1d6f",
];

const isDarkColor = (hexColor) => {
  if (!hexColor || hexColor.startsWith("http")) return false;
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
};

const handleApiError = (error, navigate, defaultMessage) => {
  const message = error.response?.data?.message || defaultMessage;
  toast.error(message);
  if (error.response?.status === 401 || error.message.includes("token")) {
    navigate("/login");
  }
  return message;
};

const BoardItem = ({ board, onUpdate, onDelete }) => {
  const { socket, socketReady } = useContext(SocketContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState(board?.title || "");
  const [editDescription, setEditDescription] = useState(board?.description || "");
  const [editVisibility, setEditVisibility] = useState(board?.visibility || "private");
  const [editBackground, setEditBackground] = useState(board?.background || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (board?.background?.startsWith("http")) {
      const img = new Image();
      img.src = board.background;
      img.onload = () => setImageError(false);
      img.onerror = () => setImageError(true);
    }
  }, [board?.background]);

  const cardBackground = useMemo(() => {
    if (imageError || !board?.background) return isDarkMode ? "#2D3748" : "#ffffff";
    if (board.background.startsWith("http")) return board.background;
    if (board.background === "#2D3748" && !isDarkMode) return "#ffffff";
    if (board.background === "#ffffff" && isDarkMode) return "#2D3748";
    return board.background;
  }, [board?.background, isDarkMode, imageError]);

  const textColor = useMemo(() => {
    if (imageError || !board?.background || board.background.startsWith("http")) return "#ffffff";
    return isDarkColor(cardBackground) ? "#ffffff" : "#2D3748";
  }, [board?.background, cardBackground, imageError]);

  const handleBoardClick = () => {
    if (!board?._id || !board?.workspace) return;
    navigate(`/workspace/${board.workspace}/board/${board._id}`);
  };

  const handleOpenEditDialog = (e) => {
    e?.stopPropagation();
    setOpenEditDialog(true);
    setEditTitle(board?.title || "");
    setEditDescription(board?.description || "");
    setEditVisibility(board?.visibility || "private");
    setEditBackground(board?.background || "");
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  const handleUpdateBoard = async () => {
    if (!editTitle.trim()) {
      toast.error("Tiêu đề bảng không được để trống!");
      return;
    }

    try {
      setIsUpdating(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập!");

      const response = await axios.put(
        `http://localhost:5000/api/boards/${board._id}`,
        { title: editTitle.trim(), description: editDescription.trim(), visibility: editVisibility, background: editBackground },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (socket && socketReady) socket.emit("boardUpdated", response.data);
      onUpdate?.(response.data);
      handleCloseEditDialog();
      toast.success("Cập nhật bảng thành công!");
    } catch (error) {
      console.error("[BoardItem] Lỗi cập nhật:", error.message);
      handleApiError(error, navigate, "Không thể cập nhật bảng!");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteBoard = async (e) => {
    e?.stopPropagation();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bảng "${board.title}" không? Hành động này không thể hoàn tác.`)) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập!");

      await axios.delete(`http://localhost:5000/api/boards/${board._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (socket && socketReady) socket.emit("board-deleted", { boardId: board._id });
      onDelete?.(board._id);
      toast.success("Xóa bảng thành công!");
    } catch (error) {
      console.error("[BoardItem] Lỗi xóa:", error.message);
      handleApiError(error, navigate, "Không thể xóa bảng!");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!board) return null;

  return (
    <>
      <Fade in>
        <Box
          sx={{
            bgcolor: cardBackground.startsWith("http") && !imageError ? "transparent" : cardBackground,
            backgroundImage: cardBackground.startsWith("http") && !imageError ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${cardBackground})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            p: 3,
            borderRadius: "16px",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: 200,
            position: "relative",
            transition: "all 0.3s ease",
            border: isDarkMode ? "1px solid #4A5568" : "1px solid #E2E8F0",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: isDarkMode ? "0 12px 40px rgba(0,0,0,0.5)" : "0 12px 40px rgba(0,0,0,0.15)",
            },
          }}
          onClick={handleBoardClick}
        >
          {isDeleting && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: "rgba(0,0,0,0.7)",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              <CircularProgress sx={{ color: "white" }} />
            </Box>
          )}
          <Typography
            variant="h6"
            sx={{
              color: textColor,
              fontWeight: 700,
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden",
              lineHeight: 1.3,
              textShadow: cardBackground.startsWith("http") && !imageError ? "0 2px 4px rgba(0,0,0,0.5)" : "none",
            }}
          >
            {board.title}
          </Typography>
          {board.description && (
            <Typography
              variant="body2"
              sx={{
                color: textColor,
                opacity: 0.9,
                fontSize: "0.9rem",
                mt: 1,
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
                lineHeight: 1.4,
                textShadow: cardBackground.startsWith("http") && !imageError ? "0 2px 4px rgba(0,0,0,0.5)" : "none",
              }}
            >
              {board.description}
            </Typography>
          )}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: "auto", pt: 2 }}>
            <Chip
              icon={board.visibility === "public" ? <PeopleIcon /> : <LockIcon />}
              label={board.visibility === "public" ? "Công khai" : "Riêng tư"}
              size="small"
              sx={{ bgcolor: "rgba(255,255,255,0.2)", color: textColor, fontWeight: 600, "& .MuiChip-icon": { color: textColor }, backdropFilter: "blur(10px)" }}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Tooltip title="Xem bảng">
                <IconButton
                  sx={{
                    color: textColor,
                    bgcolor: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(10px)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.3)", transform: "scale(1.1)" },
                    transition: "all 0.2s ease",
                    p: 1,
                  }}
                  onClick={(e) => { e.stopPropagation(); handleBoardClick(); }}
                >
                  <LaunchIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Chỉnh sửa">
                <IconButton
                  sx={{
                    color: textColor,
                    bgcolor: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(10px)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.3)", transform: "scale(1.1)" },
                    transition: "all 0.2s ease",
                    p: 1,
                  }}
                  onClick={handleOpenEditDialog}
                  disabled={isDeleting}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Xóa bảng">
                <IconButton
                  sx={{
                    color: textColor,
                    bgcolor: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(10px)",
                    "&:hover": { bgcolor: "#EF4444", color: "white", transform: "scale(1.1)" },
                    transition: "all 0.2s ease",
                    p: 1,
                  }}
                  onClick={handleDeleteBoard}
                  disabled={isDeleting}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Fade>
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
        sx={{ "& .MuiDialog-paper": { borderRadius: "16px", bgcolor: isDarkMode ? "#1A202C" : "#ffffff", color: isDarkMode ? "#E2E8F0" : "#2D3748" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.25rem", borderBottom: `1px solid ${isDarkMode ? "#4A5568" : "#E2E8F0"}` }}>
          Chỉnh sửa bảng
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Tiêu đề bảng"
            fullWidth
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)" } }}
          />
          <TextField
            margin="dense"
            label="Mô tả"
            fullWidth
            multiline
            rows={3}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)" } }}
          />
          <TextField
            margin="dense"
            label="Background (URL hoặc mã màu)"
            fullWidth
            value={editBackground}
            onChange={(e) => setEditBackground(e.target.value)}
            error={editBackground.startsWith("http") && imageError}
            helperText={editBackground.startsWith("http") && imageError ? "Không thể tải ảnh, vui lòng kiểm tra URL" : ""}
            sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)" } }}
          />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Hoặc chọn từ mẫu:</Typography>
          <Grid container spacing={1}>
            {presetBackgrounds.map((bg, index) => (
              <Grid item xs={3} key={index}>
                <Box
                  sx={{
                    width: "100%",
                    height: 60,
                    backgroundImage: `url(${bg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    borderRadius: "8px",
                    cursor: "pointer",
                    border: editBackground === bg ? "2px solid #3182CE" : "1px solid #E2E8F0",
                    "&:hover": { border: "2px solid #3182CE" },
                  }}
                  onClick={() => setEditBackground(bg)}
                />
              </Grid>
            ))}
          </Grid>
          <FormControl fullWidth margin="dense" sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)" } }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select value={editVisibility} label="Trạng thái" onChange={(e) => setEditVisibility(e.target.value)}>
              <MenuItem value="public"><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><PeopleIcon fontSize="small" /> Công khai</Box></MenuItem>
              <MenuItem value="private"><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><LockIcon fontSize="small" /> Riêng tư</Box></MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${isDarkMode ? "#4A5568" : "#E2E8F0"}` }}>
          <Button onClick={handleCloseEditDialog} disabled={isUpdating} sx={{ borderRadius: "12px", textTransform: "none", px: 3, color: isDarkMode ? "#A0AEC0" : "#718096" }}>
            Hủy
          </Button>
          <Button
            onClick={handleUpdateBoard}
            variant="contained"
            disabled={isUpdating || !editTitle.trim() || (editBackground.startsWith("http") && imageError)}
            startIcon={isUpdating ? <CircularProgress size={16} /> : null}
            sx={{ bgcolor: isDarkMode ? "#667EEA" : "#3182CE", "&:hover": { bgcolor: isDarkMode ? "#7F9CF5" : "#2B6CB0" }, borderRadius: "12px", textTransform: "none", px: 3, fontWeight: 600 }}
          >
            {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BoardItem;