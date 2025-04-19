import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
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
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { SocketContext } from "../../context/SocketContext";

function AppBar() {
  const socket = useContext(SocketContext);
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [openModal, setOpenModal] = useState(false);
  const [workspaceData, setWorkspaceData] = useState({
    name: "",
    description: "",
    background: "",
    isPublic: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const openNotifications = Boolean(anchorEl);

  // Lấy thông báo và xử lý socket
  useEffect(() => {
    if (user?._id) {
      socket.emit("join", user._id);
      console.log("AppBar tham gia phòng socket:", user._id);

      // Lấy thông báo ban đầu
      const fetchNotifications = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            "http://localhost:5000/api/notifications",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setNotifications(response.data);
          setUnreadCount(response.data.filter((n) => !n.isRead).length);
        } catch (err) {
          console.error("Error fetching notifications:", err);
          toast.error("Không thể tải thông báo!");
        }
      };
      fetchNotifications();

      // Xử lý thông báo mới
      socket.on("new-notification", (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        toast.info(notification.message, {
          autoClose: 3000,
        });
      });

      // Xử lý workspace-created để thông báo
      socket.on("workspace-created", (data) => {
        console.log("Nhận workspace-created trong AppBar:", data);
        toast.success(data.message);
      });
    }

    return () => {
      socket.off("new-notification");
      socket.off("workspace-created");
    };
  }, [user, socket]);

  // Mở/đóng menu thông báo
  const handleOpenNotifications = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setAnchorEl(null);
  };

  // Đánh dấu thông báo đã đọc
  const handleMarkAsRead = async (notificationId) => {
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
    } catch (err) {
      console.error("Error marking notification as read:", err);
      toast.error("Không thể đánh dấu thông báo!");
    }
  };

  // Đánh dấu tất cả đã đọc
  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/api/notifications/read-all",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("Đã đánh dấu tất cả thông báo là đã đọc!");
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      toast.error("Không thể đánh dấu tất cả thông báo!");
    }
  };

  // Điều hướng khi nhấn thông báo
  const handleNotificationClick = (notification) => {
    handleMarkAsRead(notification._id);
    if (notification.targetModel && notification.target) {
      switch (notification.targetModel) {
        case "Board":
          navigate(`/boards/${notification.target._id}`);
          break;
        case "Workspace":
          navigate(`/workspaces/${notification.target._id}`);
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
      if (!token) {
        throw new Error("Vui lòng đăng nhập để tạo không gian làm việc!");
      }

      console.log("Sending workspace data:", workspaceData);

      const response = await axios.post(
        "http://localhost:5000/api/workspaces",
        workspaceData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Workspace created response:", response.data);

      socket.emit("workspace-created", {
        workspace: response.data,
        message: `Workspace "${response.data.name}" đã được tạo bởi ${user.fullName}`,
      });

      toast.success("Tạo không gian làm việc thành công!");
      handleCloseModal();
    } catch (error) {
      console.error("Lỗi tạo workspace:", error);
      const message =
        error.response?.data?.message || "Lỗi khi tạo không gian làm việc!";
      setError(message);
      toast.error(message);
      if (message.includes("đăng nhập")) {
        navigate("/login");
      }
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
        <IconButton onClick={handleNavigateHome}>
          <AppsIcon sx={{ color: "white" }} />
        </IconButton>
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
                <ClearIcon
                  sx={{
                    fontSize: "1.2rem",
                    color: searchValue ? "white" : "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => setSearchValue("")}
                />
              </Tooltip>
            ),
          }}
          sx={{
            minWidth: "120px",
            maxWidth: "180px",
            "& label": { color: "white" },
            "& input": { color: "white" },
            "& label.Mui-focused": { color: "white" },
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "white" },
              "&:hover fieldset": { borderColor: "white" },
              "&.Mui-focused fieldset": { borderColor: "white" },
            },
          }}
        />
        <ModeSelect />
        <Tooltip title="Thông báo">
          <span>
            <Badge
              badgeContent={unreadCount}
              color="warning"
              sx={{ cursor: "pointer", color: "white" }}
              onClick={handleOpenNotifications}
            >
              <NotificationsIcon />
            </Badge>
          </span>
        </Tooltip>
        <Tooltip title="Trợ giúp">
          <HelpIcon sx={{ cursor: "pointer", color: "white" }} />
        </Tooltip>
        <Tooltip title="Hồ sơ">
          <Profiles />
        </Tooltip>
      </Box>
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
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreateWorkspace}
              variant="contained"
              color="primary"
              disabled={loading || !workspaceData.name.trim()}
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {loading ? "Đang tạo..." : "Tạo"}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}

export default AppBar;
