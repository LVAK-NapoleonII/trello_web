import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { deepPurple } from "@mui/material/colors";
import RecentActivities from "./RecentActivities"; // ✅ Import component mới

const ProfilePage = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    avatar: "",
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    bio: "Tôi là một lập trình viên đam mê công nghệ và thiết kế web.",
  });

  const [activities, setActivities] = useState([
    {
      id: 1,
      text: "Bạn đã thêm một thẻ mới vào danh sách 'Công việc hôm nay'",
    },
    { id: 2, text: "Bạn đã cập nhật trạng thái của thẻ 'Gửi báo cáo dự án'" },
    { id: 3, text: "Bạn đã đổi mật khẩu thành công" },
  ]);

  const handleEdit = () => setIsEditing(true);
  const handleSave = () => setIsEditing(false);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = () => {
    alert("Tính năng tải ảnh chưa được hỗ trợ!");
  };

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
            onClick={handleAvatarUpload}
          >
            <CameraAltIcon fontSize="small" />
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

        {/* Hoạt động gần đây (Component tách riêng) */}
        <RecentActivities activities={activities} userName={profile.name} />
      </Box>
    </Box>
  );
};

export default ProfilePage;
