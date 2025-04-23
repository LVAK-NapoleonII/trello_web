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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { SocketContext } from "../../context/SocketContext";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import vi from "date-fns/locale/vi";

function Profile() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const socket = useContext(SocketContext);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    console.log("Profile: Fetching activities for user:", user._id);

    const fetchActivities = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("Profile: No token found, cannot fetch activities");
          return;
        }
        const response = await axios.get(
          "http://localhost:5000/api/activities",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Profile: Activities response:", response.data);
        setActivities(response.data.activities || []);
      } catch (err) {
        console.error("Profile: Error fetching activities:", err);
        toast.error("Không thể tải hoạt động!");
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivities();

    socket.on("new-activity", (activity) => {
      console.log("Profile: Received new activity:", activity);
      if (!activity.isHidden) {
        setActivities((prev) => [activity, ...prev]);
        toast.info(activity.details || "Không có chi tiết", {
          autoClose: 3000,
        });
      }
    });

    return () => {
      socket.off("new-activity");
    };
  }, [user, socket]);

  const handleActivityClick = (activity) => {
    if (activity.target && activity.targetModel) {
      switch (activity.targetModel) {
        case "Board":
          navigate(`/boards/${activity.target._id}`);
          break;
        case "Workspace":
          navigate(`/workspaces/${activity.target._id}`);
          break;
        case "Card":
          navigate(
            `/boards/${activity.target.board}/cards/${activity.target._id}`
          );
          break;
        default:
          break;
      }
    }
  };

  const handleHideActivity = async (activityId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/activities/${activityId}/hide`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActivities((prev) => prev.filter((a) => a._id !== activityId));
      toast.success("Đã ẩn hoạt động!");
    } catch (err) {
      console.error("Profile: Error hiding activity:", err);
      toast.error("Không thể ẩn hoạt động!");
    }
  };

  const handleHideAllActivities = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/api/activities/hide-all",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActivities([]);
      toast.success("Đã ẩn tất cả hoạt động!");
    } catch (err) {
      console.error("Profile: Error hiding all activities:", err);
      toast.error("Không thể ẩn tất cả hoạt động!");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading || isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  const avatarUrl = user?.avatar
    ? user.avatar.startsWith("https://api.dicebear.com")
      ? user.avatar
      : `http://localhost:5000${user.avatar}`
    : "";

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 3, p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Avatar
          sx={{ width: 60, height: 60, mr: 2 }}
          alt={user.fullName}
          src={avatarUrl}
        />
        <Box>
          <Typography variant="h6">{user.fullName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
          <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => navigate("/profile/edit")}
            >
              Chỉnh sửa
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleLogout}
            >
              Đăng xuất
            </Button>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mb: 1, display: "flex", justifyContent: "space-between" }}>
        <Typography variant="subtitle1">Hoạt động</Typography>
        {activities.length > 0 && (
          <Button size="small" onClick={handleHideAllActivities} color="error">
            Ẩn tất cả
          </Button>
        )}
      </Box>

      <Divider />

      {activities.length === 0 ? (
        <Typography sx={{ mt: 2, textAlign: "center" }} color="text.secondary">
          Không có hoạt động nào
        </Typography>
      ) : (
        <List dense sx={{ py: 0 }}>
          {activities.map((activity) => (
            <React.Fragment key={activity._id}>
              <ListItem
                sx={{
                  borderRadius: 1,
                  py: 0.5,
                  px: 1,
                }}
                onClick={() => handleActivityClick(activity)}
              >
                <ListItemText
                  primary={activity.details || "Không có chi tiết"}
                  secondary={formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: true,
                    locale: vi,
                  })}
                  primaryTypographyProps={{
                    variant: "body2",
                    noWrap: true,
                    sx: { maxWidth: 450 },
                  }}
                  secondaryTypographyProps={{
                    variant: "caption",
                    color: "text.secondary",
                  }}
                />
                <IconButton
                  edge="end"
                  onClick={() => handleHideActivity(activity._id)}
                >
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
}

export default Profile;
