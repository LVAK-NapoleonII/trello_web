import { useState } from "react";
import { useTheme } from "@mui/material/styles"; // 📌 Import theme
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Button,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TemplateIcon from "@mui/icons-material/Category";
import HomeIcon from "@mui/icons-material/Home";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderIcon from "@mui/icons-material/Folder";
import StarIcon from "@mui/icons-material/Star";
import ImageIcon from "@mui/icons-material/Image";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import UpgradeIcon from "@mui/icons-material/Upgrade";

const Sidebar = () => {
  const [openWorkspace, setOpenWorkspace] = useState(true);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark"; // 📌 Xác định chế độ theme

  return (
    <Box
      sx={{
        width: 250,
        bgcolor: isDarkMode ? "#1E1E2D" : "#F2F2F5",
        color: isDarkMode ? "#fff" : "#333",
        height: "100vh",
        p: 2,
        transition: "all 0.3s ease",
        borderRadius: "20px",
        boxShadow: isDarkMode
          ? "0px 4px 12px rgba(0,0,0,0.5)"
          : "0px 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      {/* Danh mục chính */}
      <List>
        <ListItemButton>
          <ListItemIcon
            sx={{
              borderRadius: "8px", // ✅ Bo góc cho từng Item
              "&:hover": {
                bgcolor: isDarkMode ? "#29293D" : "#E6E6EB", // Hiệu ứng hover dịu hơn
              },
            }}
          >
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Bảng" />
        </ListItemButton>
        <ListItemButton>
          <ListItemIcon
            sx={{
              borderRadius: "8px", // ✅ Bo góc cho từng Item
              "&:hover": {
                bgcolor: isDarkMode ? "#29293D" : "#E6E6EB", // Hiệu ứng hover dịu hơn
              },
            }}
          >
            <TemplateIcon />
          </ListItemIcon>
          <ListItemText primary="Mẫu" />
        </ListItemButton>
        <ListItemButton>
          <ListItemIcon
            sx={{
              borderRadius: "8px", // ✅ Bo góc cho từng Item
              "&:hover": {
                bgcolor: isDarkMode ? "#29293D" : "#E6E6EB", // Hiệu ứng hover dịu hơn
              },
            }}
          >
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Trang chủ" />
        </ListItemButton>
      </List>

      {/* Không gian làm việc */}
      <Typography
        variant="body2"
        sx={{
          pl: 2,
          mt: 2,
          opacity: 0.7,
          color: isDarkMode ? "#aaa" : "#666", // ✅ Màu dịu hơn
        }}
      >
        CÁC KHÔNG GIAN LÀM VIỆC
      </Typography>

      <List>
        <ListItemButton onClick={() => setOpenWorkspace(!openWorkspace)}>
          <ListItemIcon sx={{ color: isDarkMode ? "#fff" : "#555" }}>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText primary="Trello Không gian làm việc" />
          {openWorkspace ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItemButton>

        <Collapse in={openWorkspace} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 4 }}>
            <ListItemButton>
              <ListItemIcon sx={{ color: isDarkMode ? "#fff" : "#555" }}>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Bảng" />
            </ListItemButton>
            <ListItemButton>
              <ListItemIcon sx={{ color: isDarkMode ? "#fff" : "#555" }}>
                <StarIcon />
              </ListItemIcon>
              <ListItemText primary="Điểm nổi bật" />
            </ListItemButton>
            <ListItemButton>
              <ListItemIcon sx={{ color: isDarkMode ? "#fff" : "#555" }}>
                <ImageIcon />
              </ListItemIcon>
              <ListItemText primary="Hình" />
            </ListItemButton>
            <ListItemButton>
              <ListItemIcon sx={{ color: isDarkMode ? "#fff" : "#555" }}>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="Thành viên" />
            </ListItemButton>
            <ListItemButton>
              <ListItemIcon sx={{ color: isDarkMode ? "#fff" : "#555" }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Cài đặt" />
            </ListItemButton>
          </List>
        </Collapse>
      </List>

      {/* Phần nâng cấp */}
      <Box
        sx={{
          bgcolor: isDarkMode ? "#333347" : "#e8eaf6", // ✅ Màu nền dịu hơn
          borderRadius: 2,
          p: 2,
          mt: 3,
          textAlign: "center",
        }}
      >
        <Typography
          variant="body2"
          sx={{ opacity: 0.8, mb: 1, color: isDarkMode ? "#ddd" : "#444" }}
        >
          Nhận các bảng không giới hạn, tự động hóa nâng cao và hơn thế nữa.
        </Typography>
        <Button
          variant="contained"
          startIcon={<UpgradeIcon />}
          sx={{
            bgcolor: isDarkMode ? "#ff6b6b" : "#d63031",
            "&:hover": { bgcolor: isDarkMode ? "#e63946" : "#b22222" },
            textTransform: "none",
          }}
        >
          Nâng cấp
        </Button>
      </Box>
    </Box>
  );
};

export default Sidebar;
