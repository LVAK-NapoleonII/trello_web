import { useState, useEffect, useContext, forwardRef } from "react";
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
  Button,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { SocketContext } from "../../../context/SocketContext";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import vi from "date-fns/locale/vi";

const Profiles = forwardRef((props, ref) => {
  const socket = useContext(SocketContext);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!user?._id) return;

    console.log("Current user ID in Profiles:", user._id);

    const fetchActivities = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("Profiles: No token found, cannot fetch activities");
          return;
        }
        const response = await axios.get(
          "http://localhost:5000/api/activities",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Activities response in Profiles:", response.data);
        if (!response.data.activities) {
          throw new Error("Không nhận được danh sách hoạt động từ server");
        }
        if (response.data.activities.length === 0) {
          console.log(
            "Profiles: Không có hoạt động nào khớp với điều kiện (isHidden: false)"
          );
        }
        setActivities(response.data.activities.slice(0, 10));
      } catch (err) {
        console.error("Lỗi khi lấy hoạt động:", err);
        toast.error("Không thể tải hoạt động!");
      }
    };
    fetchActivities();

    socket.on("new-activity", (activity) => {
      console.log("Received new activity in Profiles:", activity);
      if (!activity.isHidden) {
        setActivities((prev) => [activity, ...prev].slice(0, 10));
        toast.info(activity.details || "Không có chi tiết", {
          autoClose: 3000,
        });
      }
    });

    return () => {
      socket.off("new-activity");
    };
  }, [user, socket]);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

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
    handleClose();
  };

  const handleHideActivity = async (activityId, event) => {
    event.stopPropagation();
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
      console.error("Lỗi khi ẩn hoạt động:", err);
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
      console.error("Lỗi khi ẩn tất cả hoạt động:", err);
      toast.error("Không thể ẩn tất cả hoạt động!");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    handleClose();
  };

  const handleProfileEdit = () => {
    navigate("/profile/edit");
    handleClose();
  };

  const avatarUrl = user?.avatar
    ? user.avatar.startsWith("https://api.dicebear.com")
      ? user.avatar
      : `http://localhost:5000${user.avatar}`
    : "";

  return (
    <>
      <IconButton onClick={handleOpen} ref={ref}>
        <Avatar
          sx={{ width: 32, height: 32 }}
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
            maxWidth: 400,
            minWidth: 300,
            maxHeight: 400,
            overflowY: "auto",
            borderRadius: 2,
            boxShadow: 3,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center" }}>
          <Avatar
            sx={{ width: 40, height: 40, mr: 2 }}
            alt={user?.fullName}
            src={avatarUrl}
          />
          <Box>
            <Typography variant="subtitle2">{user?.fullName}</Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
        </Box>
        <Divider />
        <MenuItem onClick={handleProfileEdit}>
          <ListItemText primary="Chỉnh sửa hồ sơ" />
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemText primary="Đăng xuất" />
        </MenuItem>
        <Divider />
        <Box
          sx={{
            px: 2,
            py: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1">Hoạt động</Typography>
          {activities.length > 0 && (
            <Button
              size="small"
              onClick={handleHideAllActivities}
              color="error"
            >
              Ẩn tất cả
            </Button>
          )}
        </Box>
        {activities.length === 0 ? (
          <MenuItem>
            <Typography variant="body2" color="text.secondary">
              Không có hoạt động nào
            </Typography>
          </MenuItem>
        ) : (
          activities.map((activity) => (
            <MenuItem
              key={activity._id}
              onClick={() => handleActivityClick(activity)}
              sx={{
                whiteSpace: "normal",
                py: 0.5,
                px: 2,
                "&:hover": { bgcolor: "action.selected" },
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", width: "100%" }}
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
                    sx: { maxWidth: 220 },
                  }}
                  secondaryTypographyProps={{
                    variant: "caption",
                    color: "text.secondary",
                  }}
                />
                <ListItemIcon
                  sx={{ minWidth: 0 }}
                  onClick={(e) => handleHideActivity(activity._id, e)}
                >
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
              </Box>
            </MenuItem>
          ))
        )}
        {activities.length > 0 && (
          <>
            <Divider />
            <MenuItem onClick={() => navigate("/profile")}>
              <Typography
                variant="body2"
                color="primary"
                sx={{ textAlign: "center", width: "100%" }}
              >
                Xem tất cả hoạt động
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
});

export default Profiles;
