import { useState, useEffect, useContext, forwardRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar as MuiAppBar,
  Toolbar,
  Box,
  Tooltip,
  Typography,
  IconButton,
  Button,
  TextField,
  Badge,
  Modal,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from "@mui/material";
import {
  Apps as AppsIcon,
  BackupTable as BackupTableIcon,
  AddToPhotos as AddToPhotosIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
  Help as HelpIcon,
} from "@mui/icons-material";
import axios from "axios";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuth } from "../../context/AuthContext";
import { SocketContext } from "../../context/SocketContext";
import ModeSelect from "../AppBar/Menus/ModeSelect/ModeSelect";
import WorkSpace from "./Menus/WorkSpace";
import WorkspaceHistory from "./Menus/WorkspaceHistory";
import Starred from "./Menus/Starred";
import Templates from "./Menus/Templates";
import Profiles from "./Menus/Profiles";

const CustomIconButton = forwardRef(({ onClick, children, ...props }, ref) => (
  <IconButton
    ref={ref}
    onClick={onClick}
    sx={{
      color: "white",
      transition: "all 0.3s ease",
      "&:hover": {
        bgcolor: "rgba(255, 255, 255, 0.1)",
        transform: "translateY(-2px)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
      },
    }}
    {...props}
  >
    {children}
  </IconButton>
));

const handleApiError = (error, navigate, defaultMessage) => {
  const message = error.response?.data?.message || defaultMessage;
  toast.error(message);
  if (error.response?.status === 401 || error.message.includes("token")) {
    navigate("/login");
  }
  return message;
};

const AppBar = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const { socket, socketReady } = useContext(SocketContext);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchValue, setSearchValue] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [workspaceData, setWorkspaceData] = useState({
    name: "",
    description: "",
    background: "",
    isPublic: false,
  });
  const [loadingModal, setLoadingModal] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const openNotifications = Boolean(anchorEl);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập!");

      const response = await axios.get("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications(response.data.notifications.slice(0, 10));
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error("[fetchNotifications] Lỗi:", error.message);
      handleApiError(error, navigate, "Không thể tải thông báo!");
    }
  };

  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Vui lòng đăng nhập!");
      }

      // Gửi yêu cầu với notificationId đúng
      const response = await axios.put(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        {}, // Body rỗng vì không cần gửi dữ liệu
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Cập nhật state
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success(response.data.message || "Đã đánh dấu thông báo là đã đọc!");
    } catch (error) {
      console.error("[handleMarkAsRead] Lỗi:", {
        message: error.message,
        response: error.response?.data,
      });
      handleApiError(error, navigate, "Không thể đánh dấu thông báo!");
    }
  };

  const handleHideNotification = async (notificationId, event) => {
    event.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập!");

      await axios.delete(`http://localhost:5000/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      setUnreadCount((prev) =>
        Math.max(0, prev - (notifications.find((n) => n._id === notificationId)?.isRead ? 0 : 1))
      );
      toast.success("Đã ẩn thông báo!");
    } catch (error) {
      console.error("[handleHideNotification] Lỗi:", error.message);
      handleApiError(error, navigate, "Không thể ẩn thông báo!");
    }
  };

  const handleHideAllNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập!");

      await axios.delete("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications([]);
      setUnreadCount(0);
      toast.success("Đã ẩn tất cả thông báo!");
    } catch (error) {
      console.error("[handleHideAllNotifications] Lỗi:", error.message);
      handleApiError(error, navigate, "Không thể ẩn tất cả thông báo!");
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id, new Event("click"));
    }

    if (!notification.target || !notification.targetModel) {
      toast.error("Thông báo không hợp lệ!");
      handleCloseNotifications();
      return;
    }

    const { target, targetModel } = notification;
    let path = "";
    switch (targetModel) {
      case "Board":
        if (target?._id && target?.workspace?._id) {
          path = `/workspace/${target.workspace._id}/board/${target._id}`;
        }
        break;
      case "Workspace":
        if (target?._id) {
          path = `/workspace/${target._id}/boards`;
        }
        break;
      case "Card":
      case "List":
        if (target?.board?._id && target?.board?.workspace?._id) {
          path = `/workspace/${target.board.workspace._id}/board/${target.board._id}`;
        }
        break;
      case "Activity":
      case "User":
        break;
      default:
        toast.error("Loại thông báo không được hỗ trợ!");
        break;
    }

    if (path) {
      navigate(path);
    } else if (targetModel !== "Activity" && targetModel !== "User") {
      toast.error("Không thể mở: Thiếu thông tin bảng hoặc không gian làm việc!");
    }
    handleCloseNotifications();
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceData.name.trim()) {
      setError("Tên không gian làm việc không được để trống!");
      return;
    }

    try {
      setLoadingModal(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập!");

      const response = await axios.post(
        "http://localhost:5000/api/workspaces",
        workspaceData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (socket && socketReady) {
        socket.emit("workspace-created", {
          workspace: response.data,
          message: `Không gian làm việc "${response.data.name}" đã được tạo bởi ${user?.fullName || "Người dùng"}`,
        });
      }

      toast.success("Tạo không gian làm việc thành công!");
      handleCloseModal();
    } catch (error) {
      console.error("[handleCreateWorkspace] Lỗi:", error.message);
      const message = handleApiError(error, navigate, "Không thể tạo không gian làm việc!");
      setError(message);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleOpenNotifications = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setAnchorEl(null);
  };

  const handleOpenModal = () => {
    setOpenModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setWorkspaceData({ name: "", description: "", background: "", isPublic: false });
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setWorkspaceData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNavigateHome = () => {
    navigate("/boards");
  };

  useEffect(() => {
    if (loading || !user) return;

    if (!socket || !socketReady) {
      fetchNotifications();
      return;
    }

    socket.emit("join-user", user._id);
    fetchNotifications();

    const socketHandlers = {
      "new-notification": (notification) => {
        if (!notification.isHidden) {
          setNotifications((prev) => [notification, ...prev].slice(0, 10));
          setUnreadCount((prev) => prev + (notification.isRead ? 0 : 1));
          toast.info(notification.message, { autoClose: 3000 });
        }
      },
      "workspace-created": (data) => {
        toast.success(data.message);
      },
    };

    Object.entries(socketHandlers).forEach(([event, handler]) => socket.on(event, handler));
    return () => Object.entries(socketHandlers).forEach(([event, handler]) => socket.off(event, handler));
  }, [user, loading, socket, socketReady]);

  const scrollbarStyles = {
    "&::-webkit-scrollbar": { width: 6 },
    "&::-webkit-scrollbar-track": {
      bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
      borderRadius: 3,
    },
    "&::-webkit-scrollbar-thumb": {
      bgcolor: theme.palette.primary.main,
      borderRadius: 3,
    },
  };

  return (
    <MuiAppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: isDarkMode
          ? "linear-gradient(135deg, #2c3e50 0%, #1a2634 100%)"
          : "linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)",
        boxShadow: `0 4px 20px ${isDarkMode ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.15)"}`,
      }}
    >
      <Toolbar
        sx={{
          height: (theme) => theme.trelloCustom?.appBarHeight || 64,
          px: { xs: 1.5, sm: 2 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: { xs: 1, sm: 2 },
          backdropFilter: "blur(10px)",
          bgcolor: "rgba(255, 255, 255, 0.05)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
          <CustomIconButton onClick={handleNavigateHome}>
            <AppsIcon />
          </CustomIconButton>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer" }} onClick={handleNavigateHome}>
            <BackupTableIcon />
            <Typography
              component="span"
              sx={{
                fontSize: { xs: "1.1rem", sm: "1.2rem" },
                fontWeight: 600,
                color: "white",
              }}
            >
              LVAK
            </Typography>
          </Box>
          <WorkSpace onCreateWorkspace={handleOpenModal} />
          <WorkspaceHistory />
          <Starred />
          <Templates />
          <Button
            variant="outlined"
            startIcon={<AddToPhotosIcon />}
            onClick={handleOpenModal}
            sx={{
              color: "white",
              borderColor: "rgba(255, 255, 255, 0.3)",
              bgcolor: "rgba(255, 255, 255, 0.1)",
              textTransform: "none",
              fontWeight: 500,
              borderRadius: 8,
              padding: { xs: "4px 8px", sm: "6px 16px" },
              transition: "all 0.3s ease",
              "&:hover": {
                borderColor: "white",
                bgcolor: "rgba(255, 255, 255, 0.2)",
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              },
            }}
          >
            Tạo mới
          </Button>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
          <TextField
            id="outlined-search"
            label="Tìm kiếm..."
            type="text"
            size="small"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            InputProps={{
              startAdornment: (
                <Tooltip title="Tìm kiếm">
                  <SearchIcon sx={{ fontSize: "1.2rem", color: "white" }} />
                </Tooltip>
              ),
              endAdornment: searchValue && (
                <Tooltip title="Xóa tìm kiếm">
                  <CustomIconButton onClick={() => setSearchValue("")}>
                    <ClearIcon sx={{ fontSize: "1.2rem", color: "white" }} />
                  </CustomIconButton>
                </Tooltip>
              ),
            }}
            sx={{
              minWidth: { xs: "100px", sm: "140px" },
              maxWidth: "180px",
              "& label": { color: "white" },
              "& input": { color: "white" },
              "& label.Mui-focused": { color: "white" },
              "& .MuiOutlinedInput-root": {
                borderRadius: 8,
                bgcolor: "rgba(255, 255, 255, 0.1)",
                "& fieldset": { borderColor: "rgba(255, 255, 255, 0.3)" },
                "&:hover fieldset": { borderColor: "white" },
                "&.Mui-focused fieldset": { borderColor: "white" },
              },
            }}
          />
          <ModeSelect />
          <Tooltip title="Thông báo">
            <CustomIconButton onClick={handleOpenNotifications}>
              <Badge badgeContent={unreadCount} color="warning" sx={{ color: "white" }}>
                <NotificationsIcon />
              </Badge>
            </CustomIconButton>
          </Tooltip>
          <Tooltip title="Hỗ trợ">
            <CustomIconButton>
              <HelpIcon />
            </CustomIconButton>
          </Tooltip>
          <Tooltip title="Hồ sơ">
            <Profiles />
          </Tooltip>
        </Box>
      </Toolbar>
      <Menu
        anchorEl={anchorEl}
        open={openNotifications}
        onClose={handleCloseNotifications}
        PaperProps={{
          sx: {
            minWidth: 320,
            maxWidth: 400,
            maxHeight: 400,
            overflowY: "auto",
            borderRadius: 12,
            bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"}`,
            boxShadow: `0 8px 32px ${isDarkMode ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.15)"}`,
            ...scrollbarStyles,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ color: theme.palette.text.primary }}>
            Thông báo
          </Typography>
          {notifications.length > 0 && (
            <Button
              size="small"
              onClick={handleHideAllNotifications}
              color="error"
              sx={{
                textTransform: "none",
                fontWeight: 500,
                borderRadius: 8,
                "&:hover": {
                  bgcolor: `${theme.palette.error.light}20`,
                  transform: "translateY(-1px)",
                },
              }}
            >
              Xóa tất cả
            </Button>
          )}
        </Box>
        <Divider sx={{ mx: 2, my: 1, opacity: 0.5, bgcolor: isDarkMode ? "#4A5568" : "#E2E8F0" }} />
        {notifications.length === 0 ? (
          <MenuItem sx={{ justifyContent: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Không có thông báo
            </Typography>
          </MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                whiteSpace: "normal",
                py: 1,
                px: 2,
                bgcolor: !notification.isRead ? theme.palette.action.hover : "transparent",
                "&:hover": {
                  bgcolor: theme.palette.action.selected,
                  transform: "translateY(-1px)",
                },
                transition: "all 0.3s ease",
                borderRadius: 8,
                mx: 1,
                my: 0.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: 2 }}>
                <ListItemText
                  primary={notification.message || "Không có nội dung"}
                  secondary={formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                    locale: vi,
                  })}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: !notification.isRead ? 600 : 400,
                    sx: { maxWidth: 220 },
                  }}
                  secondaryTypographyProps={{
                    variant: "caption",
                    color: "text.secondary",
                  }}
                />
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  {!notification.isRead && (
                    <ListItemIcon
                      sx={{ minWidth: 0, mr: 1 }}
                      onClick={(e) => handleMarkAsRead(notification._id, e)}
                    >
                      <CheckCircleIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                  )}
                  <ListItemIcon
                    sx={{ minWidth: 0 }}
                    onClick={(e) => handleHideNotification(notification._id, e)}
                  >
                    <DeleteIcon fontSize="small" color="error" />
                  </ListItemIcon>
                </Box>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
      <Modal open={openModal} onClose={handleCloseModal} aria-labelledby="create-workspace-modal">
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: 320, sm: 400 },
            bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"}`,
            boxShadow: `0 8px 32px ${isDarkMode ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.15)"}`,
            p: 3,
            borderRadius: 12,
          }}
        >
          <Typography
            id="create-workspace-modal"
            variant="h6"
            fontWeight={600}
            mb={2}
            sx={{ color: theme.palette.text.primary }}
          >
            Tạo không gian làm việc mới
          </Typography>
          <TextField
            fullWidth
            label="Tên không gian làm việc"
            name="name"
            value={workspaceData.name}
            onChange={handleInputChange}
            margin="normal"
            required
            error={!!error && error.includes("Tên")}
            helperText={error && error.includes("Tên") ? error : ""}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 8,
                bgcolor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                "&:hover fieldset": { borderColor: theme.palette.primary.light },
                "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
              },
            }}
          />
          <TextField
            fullWidth
            label="Mô tả"
            name="description"
            value={workspaceData.description}
            onChange={handleInputChange}
            margin="normal"
            multiline
            rows={3}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 8,
                bgcolor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                "&:hover fieldset": { borderColor: theme.palette.primary.light },
                "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
              },
            }}
          />
          <TextField
            fullWidth
            label="Nền (URL hoặc mã màu)"
            name="background"
            value={workspaceData.background}
            onChange={handleInputChange}
            margin="normal"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 8,
                bgcolor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                "&:hover fieldset": { borderColor: theme.palette.primary.light },
                "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
              },
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                name="isPublic"
                checked={workspaceData.isPublic}
                onChange={handleInputChange}
                sx={{
                  color: theme.palette.text.secondary,
                  "&.Mui-checked": { color: theme.palette.primary.main },
                }}
              />
            }
            label="Công khai"
            sx={{ mt: 1 }}
          />
          {error && !error.includes("Tên") && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
            <Button
              onClick={handleCloseModal}
              color="inherit"
              disabled={loadingModal}
              sx={{
                textTransform: "none",
                borderRadius: 8,
                padding: "6px 16px",
                "&:hover": {
                  bgcolor: theme.palette.action.hover,
                  transform: "translateY(-2px)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreateWorkspace}
              variant="contained"
              color="primary"
              disabled={loadingModal || !workspaceData.name.trim()}
              startIcon={loadingModal ? <CircularProgress size={16} /> : null}
              sx={{
                textTransform: "none",
                borderRadius: 8,
                padding: "6px 16px",
                "&:hover": {
                  bgcolor: theme.palette.primary.dark,
                  transform: "translateY(-2px)",
                  boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
                },
                transition: "all 0.3s ease",
              }}
            >
              {loadingModal ? "Đang tạo..." : "Tạo"}
            </Button>
          </Box>
        </Box>
      </Modal>
    </MuiAppBar>
  );
};

export default AppBar;