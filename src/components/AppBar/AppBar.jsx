import { useState, useEffect, useContext, forwardRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ModeSelect from "../ModeSelect/ModeSelect";
import Box from "@mui/material/Box";
import AppsIcon from "@mui/icons-material/Apps";
import BackupTableIcon from "@mui/icons-material/BackupTable";
import {
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
} from "@mui/material";
import WorkSpace from "./Menus/WorkSpace";
import Recents from "./Menus/Recents";
import Starred from "./Menus/Starred";
import Templates from "./Menus/Templates";
import NotificationsIcon from "@mui/icons-material/Notifications";
import HelpIcon from "@mui/icons-material/Help";
import Profiles from "./Menus/Profiles";
import AddToPhotosIcon from "@mui/icons-material/AddToPhotos";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { SocketContext } from "../../context/SocketContext";
import { formatDistanceToNow } from "date-fns";
import vi from "date-fns/locale/vi";

const CustomIconButton = forwardRef(({ onClick, children, ...props }, ref) => (
  <IconButton ref={ref} onClick={onClick} {...props}>
    {children}
  </IconButton>
));

function AppBar() {
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
  const [loadingModal, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const openNotifications = Boolean(anchorEl);

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    if (!socket || !socketReady) {
      console.warn("Socket not available or not ready in AppBar");
      return;
    }

    socket.emit("join-user", user._id);
    console.log("AppBar: Đã tham gia phòng socket:", user._id);

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5000/api/notifications",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setNotifications(response.data.notifications.slice(0, 10));
        setUnreadCount(response.data.unreadCount || 0);
      } catch (err) {
        console.error("AppBar: Lỗi khi lấy thông báo:", err.message);
        toast.error("Không thể tải thông báo!");
      }
    };
    fetchNotifications();

    const handleNewNotification = (notification) => {
      if (!notification.isHidden) {
        setNotifications((prev) => [notification, ...prev].slice(0, 10));
        setUnreadCount((prev) => prev + (notification.isRead ? 0 : 1));
        toast.info(notification.message, { autoClose: 3000 });
      }
    };

    const handleWorkspaceCreated = (data) => {
      toast.success(data.message);
    };

    socket.on("new-notification", handleNewNotification);
    socket.on("workspace-created", handleWorkspaceCreated);

    return () => {
      socket.off("new-notification", handleNewNotification);
      socket.off("workspace-created", handleWorkspaceCreated);
    };
  }, [user, loading, socket, socketReady]);

  const handleOpenNotifications = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => prev - 1);
      toast.success("Đã đánh dấu là đã đọc!");
    } catch (err) {
      console.error("AppBar: Lỗi khi đánh dấu thông báo:", err.message);
      toast.error("Không thể đánh dấu thông báo!");
    }
  };

  const handleHideNotification = async (notificationId, event) => {
    event.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/notifications/${notificationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      setUnreadCount(
        (prev) =>
          prev -
          (notifications.find((n) => n._id === notificationId)?.isRead ? 0 : 1)
      );
      toast.success("Đã ẩn thông báo!");
    } catch (err) {
      console.error("AppBar: Lỗi khi ẩn thông báo:", err.message);
      toast.error("Không thể ẩn thông báo!");
    }
  };

  const handleHideAllNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
      setUnreadCount(0);
      toast.success("Đã ẩn tất cả thông báo!");
    } catch (err) {
      console.error("AppBar: Lỗi khi ẩn tất cả thông báo:", err.message);
      toast.error("Không thể ẩn tất cả thông báo!");
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id, new Event("click"));
    }
    if (notification.target && notification.targetModel) {
      switch (notification.targetModel) {
        case "Board":
          navigate(`/boards/${notification.target._id}`);
          break;
        case "Workspace":
          navigate(`/workspaces/${notification.target._id}`);
          break;
        case "Card":
          navigate(
            `/boards/${notification.target.board}/cards/${notification.target._id}`
          );
          break;
        default:
          break;
      }
    }
    handleCloseNotifications();
  };

  const handleNavigateHome = () => {
    navigate("/boards");
  };

  const handleOpenModal = () => {
    setOpenModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setWorkspaceData({
      name: "",
      description: "",
      background: "",
      isPublic: false,
    });
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setWorkspaceData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceData.name.trim()) {
      setError("Tên không gian làm việc không được để trống!");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/workspaces",
        workspaceData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (socket && socketReady) {
        socket.emit("workspace-created", {
          workspace: response.data,
          message: `Không gian làm việc "${response.data.name}" đã được tạo bởi ${user.fullName}`,
        });
      } else {
        console.warn("Socket not available or not ready for workspace-created");
      }
      toast.success("Tạo không gian làm việc thành công!");
      handleCloseModal();
    } catch (error) {
      const message =
        error.response?.data?.message || "Lỗi khi tạo không gian làm việc!";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      px={2}
      sx={{
        backgroundColor: "primary.contrastText",
        width: "100%",
        height: (theme) => theme.trelloCustom.appBarHeight,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        overflowX: "auto",
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "#2c3e50" : "#1565c0",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <CustomIconButton onClick={handleNavigateHome}>
          <AppsIcon sx={{ color: "white" }} />
        </CustomIconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <BackupTableIcon sx={{ color: "white" }} />
          <Typography
            component="span"
            onClick={handleNavigateHome}
            sx={{
              fontSize: "1.2rem",
              fontWeight: "bold",
              color: "white",
              cursor: "pointer",
            }}
          >
            LVAK
          </Typography>
        </Box>
        <WorkSpace onCreateWorkspace={handleOpenModal} />
        <Recents />
        <Starred />
        <Templates />
        <Button
          sx={{ color: "white", borderColor: "white" }}
          variant="outlined"
          startIcon={<AddToPhotosIcon />}
          onClick={handleOpenModal}
        >
          Tạo
        </Button>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <TextField
          id="outlined-search"
          label="Tìm kiếm ..."
          type="text"
          size="small"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          InputProps={{
            startAdornment: (
              <Tooltip title="Tìm kiếm trong Trello">
                <SearchIcon sx={{ fontSize: "1.2rem", color: "white" }} />
              </Tooltip>
            ),
            endAdornment: (
              <Tooltip title="Xóa tìm kiếm">
                <CustomIconButton onClick={() => setSearchValue("")}>
                  <ClearIcon
                    sx={{
                      fontSize: "1.2rem",
                      color: searchValue ? "white" : "transparent",
                    }}
                  />
                </CustomIconButton>
              </Tooltip>
            ),
          }}
          sx={{
            minWidth: "120px",
            maxWidth: "180px",
            "& label": { color: "white" },
            "& input": { color: "white" },
            "& label.Mui-focused": { color: "white" },
            "& .MuiPortalInput-root": {
              "& fieldset": { borderColor: "white" },
              "&:hover fieldset": { borderColor: "white" },
              "&.Mui-focused fieldset": { borderColor: "white" },
            },
          }}
        />
        <ModeSelect />
        <Tooltip title="Thông báo">
          <CustomIconButton onClick={handleOpenNotifications}>
            <Badge
              badgeContent={unreadCount}
              color="warning"
              sx={{ color: "white" }}
            >
              <NotificationsIcon />
            </Badge>
          </CustomIconButton>
        </Tooltip>
        <Tooltip title="Trợ giúp">
          <CustomIconButton>
            <HelpIcon sx={{ color: "white" }} />
          </CustomIconButton>
        </Tooltip>
        <Tooltip title="Hồ sơ">
          <Profiles />
        </Tooltip>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={openNotifications}
        onClose={handleCloseNotifications}
        PaperProps={{
          sx: {
            maxWidth: 400,
            minWidth: 300,
            maxHeight: 400,
            overflowY: "auto",
            borderRadius: 2,
            boxShadow: 3,
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1">Thông báo</Typography>
          {notifications.length > 0 && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                onClick={handleHideAllNotifications}
                color="error"
              >
                Ẩn tất cả
              </Button>
            </Box>
          )}
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <MenuItem>
            <Typography variant="body2" color="text.secondary">
              Không có thông báo nào
            </Typography>
          </MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                whiteSpace: "normal",
                py: 0.5,
                px: 2,
                bgcolor: !notification.isRead ? "action.hover" : "inherit",
                "&:hover": { bgcolor: "action.selected" },
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", width: "100%" }}
              >
                <ListItemText
                  primary={notification.message || "Không có nội dung"}
                  secondary={formatDistanceToNow(
                    new Date(notification.createdAt),
                    {
                      addSuffix: true,
                      locale: vi,
                    }
                  )}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: !notification.isRead ? "bold" : "normal",
                    noWrap: true,
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
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="create-workspace-modal"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography id="create-workspace-modal" variant="h6" mb={2}>
            Tạo Không Gian Làm Việc Mới
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
          />
          <TextField
            fullWidth
            label="Background (URL)"
            name="background"
            value={workspaceData.background}
            onChange={handleInputChange}
            margin="normal"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="isPublic"
                checked={workspaceData.isPublic}
                onChange={handleInputChange}
              />
            }
            label="Công khai"
          />
          {error && !error.includes("Tên") && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}
          >
            <Button
              onClick={handleCloseModal}
              color="inherit"
              disabled={loadingModal}
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreateWorkspace}
              variant="contained"
              color="primary"
              disabled={loadingModal || !workspaceData.name.trim()}
              startIcon={loadingModal ? <CircularProgress size={16} /> : null}
            >
              {loadingModal ? "Đang tạo..." : "Tạo"}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}

export default AppBar;
