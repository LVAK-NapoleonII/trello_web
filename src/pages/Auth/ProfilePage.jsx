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

const ProfilePage = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const { user, updateUser, loading } = useAuth();
  const socket = useContext(SocketContext);
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

  useEffect(() => {
    if (loading) return;

    if (!user) {
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
    if (!user) return;

    const fetchActivities = async () => {
      setIsLoadingActivities(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("ProfilePage: No token found, cannot fetch activities");
          return;
        }
        const response = await axios.get(
          "http://localhost:5000/api/activities",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("ProfilePage: Activities response:", response.data);
        setActivities(response.data.activities || []);
      } catch (err) {
        console.error("ProfilePage: Error fetching activities:", err);
        toast.error("Không thể tải hoạt động!");
      } finally {
        setIsLoadingActivities(false);
      }
    };
    fetchActivities();

    socket.on("new-activity", (activity) => {
      console.log("ProfilePage: Received new activity:", activity);
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

  const handleEdit = () => setIsEditing(true);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
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
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const token = localStorage.getItem("token");
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
      console.error("ProfilePage: Error hiding activity:", err);
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
      console.error("ProfilePage: Error hiding all activities:", err);
      toast.error("Không thể ẩn tất cả hoạt động!");
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
          navigate(
            `/boards/${activity.target.board}/cards/${activity.target._id}`
          );
          break;
        default:
          break;
      }
    }
  };

  if (loading || isLoadingActivities) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        p: 3,
      }}
    >
      <Box
        sx={{
          width: "480px",
          p: 4,
          borderRadius: 3,
          background: isDarkMode ? "#161b22" : "#fff",
          boxShadow: isDarkMode ? 3 : "0px 4px 10px rgba(0, 0, 0, 0.1)",
          textAlign: "center",
        }}
      >
        {/* Avatar */}
        <Box sx={{ position: "relative", width: "100px", margin: "0 auto" }}>
          <Avatar
            src={profile.avatar}
            sx={{
              width: 100,
              height: 100,
              bgcolor: deepPurple[500],
              fontSize: "2rem",
            }}
          >
            {profile.name.charAt(0)}
          </Avatar>
          <IconButton
            sx={{
              position: "absolute",
              bottom: 0,
              right: 0,
              background: "#fff",
              boxShadow: 1,
              "&:hover": { background: "#eee" },
            }}
            component="label"
          >
            <CameraAltIcon fontSize="small" />
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarUpload}
            />
          </IconButton>
        </Box>

        {/* User Information */}
        <Typography variant="h5" fontWeight="bold" mt={2}>
          {profile.name}
        </Typography>
        <Typography variant="body2" color="textSecondary">
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
            sx={{ mt: 2 }}
          />
        ) : (
          <Typography variant="body1" mt={2} sx={{ fontStyle: "italic" }}>
            {profile.bio}
          </Typography>
        )}

        {/* Edit / Save Button */}
        <Button
          variant="contained"
          startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
          sx={{
            mt: 2,
            width: "100%",
            bgcolor: "#6a11cb",
            "&:hover": { bgcolor: "#2575fc" },
            color: "white",
            transition: "0.3s",
          }}
          onClick={isEditing ? handleSave : handleEdit}
        >
          {isEditing ? "Lưu Thay Đổi" : "Chỉnh Sửa"}
        </Button>

        {/* Recent Activities */}
        <RecentActivities
          activities={activities}
          userName={profile.name}
          onHideActivity={handleHideActivity}
          onHideAllActivities={handleHideAllActivities}
          onActivityClick={handleActivityClick}
        />
      </Box>
    </Box>
  );
};

export default ProfilePage;
