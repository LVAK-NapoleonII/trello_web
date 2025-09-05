import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  IconButton,
  useTheme,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { SocketContext } from "../../context/SocketContext";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import vi from "date-fns/locale/vi";

const containerStyles = {
  maxWidth: 600,
  mx: "auto",
  mt: 3,
  p: 2,
  borderRadius: 12,
  backdropFilter: "blur(12px)",
};

const buttonStyles = {
  textTransform: "none",
  borderRadius: 8,
  padding: "6px 16px",
  "&:hover": {
    transform: "translateY(-2px)",
    transition: "all 0.3s ease",
  },
};

const listItemStyles = {
  borderRadius: 8,
  py: 1,
  px: 1,
  cursor: "pointer",
  "&:hover": {
    transform: "translateY(-1px)",
    transition: "all 0.3s ease",
  },
};

const useProfile = () => {
  const { user, logout, loading } = useAuth();
  const { socket, socketReady } = useContext(SocketContext);
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập lại!");
      const response = await axios.get("http://localhost:5000/api/activities", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10, page: 1 },
      });
      setActivities(response.data.activities || []);
    } catch (err) {
      toast.error("Không thể tải hoạt động!");
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        logout();
        navigate("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user?._id) {
      navigate("/login");
      return;
    }
    fetchActivities();

    if (!socket || !socketReady || joined) return;

    socket.emit("join-user", user._id);
    setJoined(true);

    socket.on("new-activity", (activity) => {
      if (!activity.isHidden && activity.target) {
        setActivities((prev) => [activity, ...prev].slice(0, 10));
        toast.info(activity.details || "Không có chi tiết", { autoClose: 3000 });
      }
    });

    return () => {
      socket?.off("new-activity");
      setJoined(false);
    };
  }, [user, socket, socketReady, joined, navigate, logout]);

  return { user, logout, loading, activities, isLoading, fetchActivities };
};

function Profile() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const { user, logout, loading, activities, isLoading, fetchActivities } = useProfile();

  const handleActivityClick = (activity) => {
    if (!activity.target || !activity.targetModel) {
      toast.error("Hoạt động không hợp lệ, thiếu thông tin mục tiêu!");
      return;
    }
    switch (activity.targetModel) {
      case "Board":
        if (!activity.target._id) {
          toast.error("Không thể điều hướng: Thiếu ID bảng!");
          return;
        }
        navigate(`/boards/${activity.target._id}`);
        break;
      case "Workspace":
        if (!activity.target._id) {
          toast.error("Không thể điều hướng: Thiếu ID không gian làm việc!");
          return;
        }
        navigate(`/workspace/${activity.target._id}/boards`);
        break;
      case "Card":
        const workspaceId = activity.target.board?.workspace?._id || activity.target.board?.workspace;
        const boardId = activity.target.board?._id;
        if (boardId && workspaceId) {
          navigate(`/workspace/${workspaceId}/board/${boardId}`);
        } else {
          toast.error("Không thể điều hướng: Thiếu thông tin bảng hoặc không gian làm việc!");
        }
        break;
      default:
        toast.error("Loại hoạt động không được hỗ trợ!");
    }
  };

  const handleHideActivity = async (activityId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập lại!");
      await axios.put(`http://localhost:5000/api/activities/${activityId}/hide`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivities((prev) => prev.filter((a) => a._id !== activityId));
      toast.success("Đã ẩn hoạt động!");
    } catch (err) {
      toast.error("Không thể ẩn hoạt động!");
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        logout();
        navigate("/login");
      }
    }
  };

  const handleHideAllActivities = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập lại!");
      await axios.put("http://localhost:5000/api/activities/hide-all", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivities([]);
      toast.success("Đã ẩn tất cả hoạt động!");
    } catch (err) {
      toast.error("Không thể ẩn tất cả hoạt động!");
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        logout();
        navigate("/login");
      }
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");
      logout();
      navigate("/login");
      toast.success("Đã đăng xuất!");
    } catch (err) {
      toast.error("Không thể đăng xuất!");
    }
  };

  if (loading || isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!user?._id) return null;

  const avatarUrl = user.avatar?.startsWith("https://api.dicebear.com")
    ? user.avatar
    : `http://localhost:5000${user.avatar}` || "";

  return (
    <Box
      sx={{
        ...containerStyles,
        bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.6)",
        border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"}`,
        boxShadow: `0 8px 32px ${isDarkMode ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.15)"}`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Avatar
          sx={{ width: 60, height: 60, mr: 2, border: `2px solid ${theme.palette.primary.main}` }}
          alt={user.fullName}
          src={avatarUrl}
        />
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {user.fullName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
          <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => navigate("/profile/edit")}
              sx={{ ...buttonStyles, "&:hover": { bgcolor: theme.palette.primary.light + "20" } }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleLogout}
              sx={{ ...buttonStyles, "&:hover": { bgcolor: theme.palette.error.light + "20" } }}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Activities
        </Typography>
        {activities.length > 0 && (
          <Button
            size="small"
            onClick={hiddenAllActivities}
            color="error"
            sx={{ ...buttonStyles, "&:hover": { bgcolor: theme.palette.error.light + "20" } }}
          >
            Clear All
          </Button>
        )}
      </Box>

      <Divider sx={{ my: 1, opacity: 0.5 }} />

      {
        activities.length === 0 ? (
          <Typography sx={{ mt: 2, textAlign: "center" }} color="text.secondary">
            No activities
          </Typography>
        ) : (
          <List
            dense
            sx={{
              py: 0,
              "&::-webkit-scrollbar": { width: 6 },
              "&::-webkit-scrollbar-track": {
                bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                borderRadius: 3,
              },
              "&::-webkit-scrollbar-thumb": { bgcolor: theme.palette.primary.main, borderRadius: 3 },
            }}
          >
            {activities.map((activity) => (
              <React.Fragment key={activity._id}>
                <ListItem
                  sx={{ ...listItemStyles, "&:hover": { bgcolor: theme.palette.action.selected } }}
                  onClick={() => handleActivityClick(activity)}
                >
                  <ListItemText
                    primary={activity.details || "No details"}
                    secondary={formatDistanceToNow(new Date(activity.createdAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                    primaryTypographyProps={{ variant: "body2", fontWeight: 500, sx: { maxWidth: 450 } }}
                    secondaryTypographyProps={{ variant: "caption", color: "text.secondary" }}
                  />
                  <IconButton
                    edge="end"
                    onClick={() => handleHideActivity(activity._id)}
                    sx={{
                      color: theme.palette.error.main,
                      "&:hover": { bgcolor: theme.palette.error.light + "20" },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItem>
                <Divider component="li" sx={{ my: 0.5, opacity: 0.5 }} />
              </React.Fragment>
            ))}
          </List>
        )
      }
    </Box >
  );
}

export default Profile;