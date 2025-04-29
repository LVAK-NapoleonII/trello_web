import { useState, useEffect, useContext } from "react";
import {
  Avatar,
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  useTheme,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { deepPurple } from "@mui/material/colors";
import RecentActivities from "./RecentActivities";
import { useAuth } from "../../context/AuthContext";
import { SocketContext } from "../../context/SocketContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const ProfilePage = () => {
  const theme = useTheme();
  const { user, updateUser, loading, logout } = useAuth();
  const { socket, socketReady } = useContext(SocketContext);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    avatar: "",
    name: "",
    email: "",
    bio: "",
  });
  const [activities, setActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const activitiesPerPage = 10;

  useEffect(() => {
    if (loading) return;

    if (!user?._id) {
      console.log("ProfilePage: No user, redirecting to login");
      navigate("/login");
    } else {
      setProfile({
        avatar: user?.avatar
          ? user.avatar.startsWith("https://api.dicebear.com")
            ? user.avatar
            : `http://localhost:5000${user.avatar}`
          : "",
        name: user?.fullName || "Nguyễn Văn A",
        email: user?.email || "nguyenvana@example.com",
        bio:
          user?.bio ||
          "Tôi là một lập trình viên đam mê công nghệ và thiết kế web.",
      });
    }
  }, [user, navigate, loading]);

  useEffect(() => {
    if (!user?._id) {
      console.log("ProfilePage: No user ID, skipping activities fetch");
      return;
    }

    const fetchActivities = async () => {
      setIsLoadingActivities(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("ProfilePage: No token found, cannot fetch activities");
          toast.error("Vui lòng đăng nhập lại!");
          navigate("/login");
          return;
        }
        console.log("ProfilePage: Fetching activities for user:", user._id);
        const response = await axios.get(
          "http://localhost:5000/api/activities",
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { page, limit: activitiesPerPage },
          }
        );
        console.log("ProfilePage: Activities response:", response.data);
        const newActivities = response.data.activities || [];
        setActivities((prev) =>
          page === 1 ? newActivities : [...prev, ...newActivities]
        );
        setHasMore(newActivities.length === activitiesPerPage);
      } catch (err) {
        console.error("ProfilePage: Error fetching activities:", err);
        toast.error("Không thể tải hoạt động!");
        if (err.response?.status === 401) {
          console.log("ProfilePage: Unauthorized, logging out");
          localStorage.removeItem("token");
          logout();
          navigate("/login");
        }
      } finally {
        setIsLoadingActivities(false);
      }
    };
    fetchActivities();

    if (!socket || !socketReady) {
      console.log("ProfilePage: Socket not available or not ready");
      return;
    }

    console.log("ProfilePage: Setting up socket listeners for user:", user._id);
    socket.emit("join-user", user._id);

    socket.on("new-activity", (activity) => {
      console.log("ProfilePage: Received new activity:", activity);
      if (!activity.isHidden) {
        setActivities((prev) =>
          [activity, ...prev].slice(0, activitiesPerPage * page)
        );
        toast.info(activity.details || "Không có chi tiết", {
          autoClose: 3000,
        });
      }
    });

    return () => {
      if (socket) {
        console.log("ProfilePage: Cleaning up socket listeners");
        socket.off("new-activity");
      }
    };
  }, [user, socket, socketReady, navigate, logout, page]);

  const handleEdit = () => setIsEditing(true);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vui lòng đăng nhập lại!");
        navigate("/login");
        return;
      }
      await axios.put(
        "http://localhost:5000/api/auth/update-profile",
        { fullName: profile.name, bio: profile.bio },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateUser({ ...user, fullName: profile.name, bio: profile.bio });
      toast.success("Cập nhật hồ sơ thành công!");
      setIsEditing(false);
    } catch (err) {
      console.error("ProfilePage: Error updating profile:", err);
      toast.error("Không thể cập nhật hồ sơ!");
      if (err.response?.status === 401) {
        console.log("ProfilePage: Unauthorized, logging out");
        localStorage.removeItem("token");
        logout();
        navigate("/login");
      }
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      toast.error("Chỉ hỗ trợ file JPEG, PNG hoặc GIF!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File phải nhỏ hơn 5MB!");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vui lòng đăng nhập lại!");
        navigate("/login");
        return;
      }
      const response = await axios.post(
        "http://localhost:5000/api/auth/update-avatar",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const updatedAvatar = `http://localhost:5000${response.data.user.avatar}`;
      setProfile({ ...profile, avatar: updatedAvatar });
      updateUser(response.data.user);
      toast.success("Cập nhật avatar thành công!");
    } catch (error) {
      console.error("ProfilePage: Error uploading avatar:", error);
      toast.error("Không thể upload avatar. Vui lòng thử lại!");
      if (error.response?.status === 401) {
        console.log("ProfilePage: Unauthorized, logging out");
        localStorage.removeItem("token");
        logout();
        navigate("/login");
      }
    }
  };

  const handleHideActivity = async (activityId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vui lòng đăng nhập lại!");
        navigate("/login");
        return;
      }
      await axios.put(
        `http://localhost:5000/api/activities/${activityId}/hide`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActivities((prev) => prev.filter((a) => a._id !== activityId));
      toast.success("Đã ẩn hoạt động!");
    } catch (err) {
      console.error("ProfilePage: Error hiding activity:", err);
      toast.error("Không thể ẩn hoạt động!");
      if (err.response?.status === 401) {
        console.log("ProfilePage: Unauthorized, logging out");
        localStorage.removeItem("token");
        logout();
        navigate("/login");
      }
    }
  };

  const handleHideAllActivities = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vui lòng đăng nhập lại!");
        navigate("/login");
        return;
      }
      await axios.put(
        "http://localhost:5000/api/activities/hide-all",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActivities([]);
      toast.success("Đã ẩn tất cả hoạt động!");
      setPage(1);
    } catch (err) {
      console.error("ProfilePage: Error hiding all activities:", err);
      toast.error("Không thể ẩn tất cả hoạt động!");
      if (err.response?.status === 401) {
        console.log("ProfilePage: Unauthorized, logging out");
        localStorage.removeItem("token");
        logout();
        navigate("/login");
      }
    }
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
          if (activity.target.board) {
            navigate(
              `/boards/${activity.target.board.id}/cards/${activity.target._id}`
            );
          } else {
            console.warn(
              "ProfilePage: Missing board ID for card activity",
              activity
            );
            toast.error("Không thể điều hướng: Thiếu thông tin bảng!");
          }
          break;
        default:
          break;
      }
    }
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  if (loading || isLoadingActivities) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #1e3a8a, #3b0764)"
              : "linear-gradient(135deg, #6a11cb, #2575fc)",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user?._id) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, #1e3a8a, #3b0764)"
            : "linear-gradient(135deg, #6a11cb, #2575fc)",
        p: 3,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          sx={{
            width: { xs: "90%", sm: 480 },
            p: 4,
            borderRadius: 12,
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(30,30,30,0.9)"
                : "rgba(255,255,255,0.9)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            border: (theme) =>
              theme.palette.mode === "dark"
                ? "1px solid rgba(255,255,255,0.1)"
                : "1px solid rgba(0,0,0,0.05)",
            textAlign: "center",
            transition: "box-shadow 0.3s ease, transform 0.3s ease",
            "&:hover": {
              boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
            },
          }}
        >
          {/* Avatar */}
          <Box
            sx={{
              position: "relative",
              width: 120,
              height: 120,
              margin: "0 auto",
              mb: 3,
            }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Avatar
                src={profile.avatar}
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: deepPurple[500],
                  fontSize: "2.5rem",
                  border: "3px solid",
                  borderColor: (theme) =>
                    theme.palette.mode === "dark" ? "#6a11cb" : "#2575fc",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  transition: "transform 0.2s ease",
                }}
              >
                {profile.name.charAt(0)}
              </Avatar>
            </motion.div>
            <IconButton
              sx={{
                position: "absolute",
                bottom: 0,
                right: 0,
                background: (theme) =>
                  theme.palette.mode === "dark" ? "#2c2c2c" : "#fff",
                border: "2px solid",
                borderColor: (theme) =>
                  theme.palette.mode === "dark" ? "#6a11cb" : "#2575fc",
                "&:hover": {
                  background: (theme) => theme.palette.action.hover,
                  transform: "scale(1.1)",
                },
                transition: "background 0.2s ease, transform 0.2s ease",
              }}
              component="label"
              disabled={isEditing}
            >
              <CameraAltIcon fontSize="small" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif"
                hidden
                onChange={handleAvatarUpload}
              />
            </IconButton>
          </Box>

          {/* User Information */}
          {isEditing ? (
            <TextField
              fullWidth
              name="name"
              value={profile.name}
              onChange={handleChange}
              margin="normal"
              label="Họ và tên"
              sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: 8 } }}
            />
          ) : (
            <Typography
              variant="h5"
              fontWeight="bold"
              mt={2}
              sx={{
                color: (theme) =>
                  theme.palette.mode === "dark" ? "#fff" : "#333",
              }}
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {profile.name}
            </Typography>
          )}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, fontStyle: "italic" }}
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {profile.email}
          </Typography>

          {/* Bio */}
          {isEditing ? (
            <TextField
              fullWidth
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={3}
              label="Tiểu sử"
              sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: 8 } }}
            />
          ) : (
            <Typography
              variant="body1"
              mt={2}
              sx={{
                fontStyle: "italic",
                color: (theme) =>
                  theme.palette.mode === "dark" ? "#ddd" : "#555",
              }}
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {profile.bio}
            </Typography>
          )}

          {/* Edit / Save Button */}
          <Button
            variant="contained"
            startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
            sx={{
              mt: 3,
              width: "100%",
              py: 1.2,
              borderRadius: 8,
              background: "linear-gradient(45deg, #6a11cb, #2575fc)",
              "&:hover": {
                background: "linear-gradient(45deg, #5b0ec9, #1f66e5)",
                transform: "scale(1.02)",
              },
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              transition: "background 0.2s ease, transform 0.2s ease",
            }}
            onClick={isEditing ? handleSave : handleEdit}
            component={motion.button}
            whileHover={{ scale: 1 }}
            whileTap={{ scale: 0.98 }}
          >
            {isEditing ? "Lưu Thay Đổi" : "Chỉnh Sửa"}
          </Button>

          {/* Recent Activities */}
          <Box sx={{ mt: 3 }}>
            <RecentActivities
              activities={activities}
              userName={profile.name}
              onHideActivity={handleHideActivity}
              onHideAllActivities={handleHideAllActivities}
              onActivityClick={handleActivityClick}
            />
            {hasMore && (
              <Button
                variant="outlined"
                sx={{
                  mt: 2,
                  width: "100%",
                  borderRadius: 8,
                  "&:hover": {
                    background: (theme) => theme.palette.action.hover,
                    transform: "scale(1.02)",
                  },
                  transition: "background 0.2s ease, transform 0.2s ease",
                }}
                onClick={handleLoadMore}
                component={motion.button}
                whileHover={{ scale: 1 }}
                whileTap={{ scale: 0.98 }}
              >
                Tải thêm
              </Button>
            )}
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
};

export default ProfilePage;
