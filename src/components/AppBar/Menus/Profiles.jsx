import React, { useState, useEffect, useContext, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Menu,
  MenuItem,
  ListItemText,
  Divider,
  Typography,
  Box,
  IconButton,
  ListItemIcon,
  useTheme,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { SocketContext } from "../../../context/SocketContext";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import vi from "date-fns/locale/vi";

const menuStyles = {
  minWidth: 320,
  maxWidth: 400,
  maxHeight: 400,
  overflowY: "auto",
  borderRadius: 12,
  backdropFilter: "blur(12px)",
  "&::-webkit-scrollbar": { width: 6 },
  "&::-webkit-scrollbar-track": { borderRadius: 3 },
  "&::-webkit-scrollbar-thumb": { borderRadius: 3 },
};

const menuItemStyles = {
  borderRadius: 8,
  mx: 1,
  my: 0.5,
  "&:hover": {
    bgcolor: "action.selected",
    transform: "translateY(-1px)",
  },
  transition: "all 0.3s ease",
};

const useProfileMenu = () => {
  const { user, logout } = useAuth();
  const { socket, socketReady } = useContext(SocketContext);
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập lại!");
      const response = await axios.get("http://localhost:5000/api/activities", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivities(response.data.activities?.slice(0, 10) || []);
    } catch (err) {
      toast.error("Không thể tải hoạt động!");
    }
  };

  useEffect(() => {
    if (!user?._id) return;
    fetchActivities();

    if (!socket || !socketReady) return;

    socket.on("new-activity", (activity) => {
      if (!activity.isHidden) {
        setActivities((prev) => [activity, ...prev].slice(0, 10));
        toast.info(activity.details || "Không có chi tiết", { autoClose: 3000 });
      }
    });

    return () => socket.off("new-activity");
  }, [user, socket, socketReady]);

  return { user, logout, activities, fetchActivities, navigate, setActivities };
};

const Profiles = forwardRef((props, ref) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const { user, logout, activities, navigate, setActivities } = useProfileMenu();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  if (!user) {
    return <Typography>Đang tải...</Typography>;
  }
  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleActivityClick = (activity) => {
    if (!activity.target || !activity.targetModel) {
      toast.error("Hoạt động không hợp lệ!");
      return;
    }
    switch (activity.targetModel) {
      case "Board":
        navigate(`/boards/${activity.target._id}`);
        break;
      case "Workspace":
        navigate(`/workspace/${activity.target._id}/boards`);
        break;
      case "Card":
        const workspaceId = activity.target.board?.workspace?._id || activity.target.board?.workspace;
        const boardId = activity.target.board?._id;
        if (boardId && workspaceId) {
          navigate(`/workspace/${workspaceId}/board/${boardId}`);
        } else {
          toast.error("Thiếu thông tin bảng hoặc không gian làm việc!");
        }
        break;
      default:
        break;
    }
    handleClose();
  };

  const handleHideActivity = async (activityId, event) => {
    event.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/activities/${activityId}/hide`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivities((prev) => prev.filter((a) => a._id !== activityId));
      toast.success("Đã ẩn hoạt động!");
    } catch (err) {
      // toast.error("Không thể ẩn hoạt động!");
    }
  };

  const handleHideAllActivities = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put("http://localhost:5000/api/activities/hide-all", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivities([]);
      toast.success("Đã ẩn tất cả hoạt động!");
    } catch (err) {
      // toast.error("Không thể ẩn tất cả hoạt động!");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    handleClose();
  };

  const avatarUrl = user?.avatar?.startsWith("https://api.dicebear.com")
    ? user.avatar
    : `http://localhost:5000${user.avatar}` || "";

  return (
    <>
      <IconButton
        onClick={handleOpen}
        ref={ref}
        sx={{
          "&:hover": {
            bgcolor: "rgba(255, 255, 255, 0.1)",
            transform: "translateY(-2px)",
            boxShadow: `0 4px 12px rgba(0, 0, 0, 0.2)`,
          },
          transition: "all 0.3s ease",
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            border: `2px solid ${isDarkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.1)"}`,
          }}
          alt={user?.fullName}
          src={avatarUrl}
        />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            ...menuStyles,
            bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.6)",
            border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"}`,
            boxShadow: `0 8px 32px ${isDarkMode ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.15)"}`,
            "&::-webkit-scrollbar-track": {
              bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
            },
            "&::-webkit-scrollbar-thumb": { bgcolor: theme.palette.primary.main },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center" }}>
          <Avatar
            sx={{ width: 40, height: 40, mr: 2, border: `2px solid ${theme.palette.primary.main}` }}
            alt={user?.fullName}
            src={avatarUrl}
          />
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {user?.fullName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ mx: 2, my: 1, opacity: 0.5 }} />
        <MenuItem
          onClick={() => { navigate("/profile"); handleClose(); }}
          sx={menuItemStyles}
        >
          <ListItemText primary="Edit Profile" primaryTypographyProps={{ fontWeight: 500 }} />
        </MenuItem>
        {user?.isAdmin && (
          <MenuItem
            onClick={() => { navigate("/admin"); handleClose(); }}
            sx={menuItemStyles}
          >
            <ListItemText primary="Manages" primaryTypographyProps={{ fontWeight: 500 }} />
          </MenuItem>
        )}
        <MenuItem
          onClick={handleLogout}
          sx={menuItemStyles}
        >
          <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 500 }} />
        </MenuItem>
        <Divider sx={{ mx: 2, my: 1, opacity: 0.5 }} />
        <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Activities
          </Typography>
          {activities.length > 0 && (
            <IconButton
              size="small"
              onClick={handleHideAllActivities}
              sx={{ color: theme.palette.error.main, "&:hover": { bgcolor: theme.palette.error.light + "20" } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
        {activities.length === 0 ? (
          <MenuItem sx={{ justifyContent: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No activities
            </Typography>
          </MenuItem>
        ) : (
          activities.map((activity) => (
            <MenuItem
              key={activity._id}
              onClick={() => handleActivityClick(activity)}
              sx={{ ...menuItemStyles, whiteSpaceiteral: "normal" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: 2 }}>
                <ListItemText
                  primary={activity.details || "No details"}
                  secondary={formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: true,
                    locale: vi,
                  })}
                  primaryTypographyProps={{ variant: "body2", fontWeight: 500, sx: { maxWidth: 220 } }}
                  secondaryTypographyProps={{ variant: "caption", color: "text.secondary" }}
                />
                <ListItemIcon sx={{ minWidth: 0 }} onClick={(e) => handleHideActivity(activity._id, e)}>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
              </Box>
            </MenuItem>
          ))
        )}
        {activities.length > 0 && (
          <>
            <Divider sx={{ mx: 2, my: 1, opacity: 0.5 }} />
            <MenuItem
              onClick={() => navigate("/profile")}
              sx={menuItemStyles}
            >
              <Typography variant="body2" color="primary" sx={{ textAlign: "center", width: "100%", fontWeight: 500 }}>
                View all activities
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
});

export default Profiles;