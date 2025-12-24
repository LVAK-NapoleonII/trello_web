// components/MemberMenu.jsx
import {
  Menu,
  MenuItem,
  Typography,
  Fade,
  useTheme,
  Box,
  Avatar,
  Divider,
  ListItemIcon,
  ListItemText,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonIcon from "@mui/icons-material/Person";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { toast } from "react-toastify";

function MemberMenu({
  anchorEl,
  selectedMember,
  isOwner,
  board,
  onlineUsers,
  handleCloseMenu,
  handleRemoveMember,
}) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const isOnline =
    selectedMember &&
    onlineUsers &&
    (onlineUsers.has(selectedMember.user?._id) || selectedMember.user?.isOnline);

  const isSelectedMemberOwner = selectedMember?.user?._id === board?.owner?._id;

  const handleRemoveClick = () => {
    const userId = selectedMember?.user?._id?.toString();
    if (!userId || userId === "undefined") {
      console.warn("Invalid userId in MemberMenu:", selectedMember);
      toast.error("Không thể xóa: ID người dùng không hợp lệ!");
      handleCloseMenu();
      return;
    }
    handleRemoveMember(userId);
    handleCloseMenu();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleCloseMenu}
      TransitionComponent={Fade}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      PaperProps={{
        sx: {
          minWidth: 280,
          maxWidth: 320,
          borderRadius: 12,
          background: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(12px)",
          border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"}`,
          boxShadow: `0 8px 32px ${isDarkMode ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.15)"}`,
          "& .MuiMenuItem-root": { borderRadius: 8, mx: 1, my: 0.5 },
        },
      }}
    >
      {/* === HEADER === */}
      <MenuItem disabled sx={{ opacity: "1 !important", cursor: "default" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%", py: 1.5 }}>
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={
                selectedMember?.user?.avatar
                  ? selectedMember.user.avatar.startsWith("http")
                    ? selectedMember.user.avatar
                    : `http://localhost:5000${selectedMember.user.avatar}`
                  : "/static/images/avatar/1.jpg"
              }
              sx={{
                width: 48,
                height: 48,
                border: `3px solid ${isOnline ? theme.palette.success.main : theme.palette.grey[500]}`,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: 2,
                right: 2,
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: isOnline ? theme.palette.success.main : theme.palette.grey[500],
                border: `2px solid ${theme.palette.background.paper}`,
              }}
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {selectedMember?.user?.fullName || selectedMember?.user?.email}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <FiberManualRecordIcon
                  sx={{ fontSize: 8, color: isOnline ? "success.main" : "grey.500" }}
                />
                <Typography variant="caption" color="text.secondary">
                  {isOnline ? "Online" : "Offline"}
                </Typography>
              </Box>

              <Chip
                icon={isSelectedMemberOwner ? <AdminPanelSettingsIcon /> : <PersonIcon />}
                label={isSelectedMemberOwner ? "Chủ phòng" : "Thành viên"}
                size="small"
                color={isSelectedMemberOwner ? "primary" : "default"}
                variant="outlined"
                sx={{ fontSize: "0.7rem", height: 20 }}
              />
            </Box>

            {selectedMember?.user?.fullName && selectedMember?.user?.email && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
                {selectedMember.user.email}
              </Typography>
            )}
          </Box>
        </Box>
      </MenuItem>

      <Divider sx={{ mx: 2, my: 1 }} />

      {/* === REMOVE BUTTON === */}
      {isOwner && !isSelectedMemberOwner && (
        <MenuItem
          onClick={handleRemoveClick}
          sx={{
            color: "error.main",
            "&:hover": {
              bgcolor: "error.light",
              color: "error.contrastText",
              "& .MuiListItemIcon-root": { color: "error.contrastText" },
            },
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2" fontWeight={500}>
              Xóa thành viên khỏi bảng
            </Typography>
          </ListItemText>
        </MenuItem>
      )}

      {/* === DISABLED MESSAGE === */}
      {(!isOwner || isSelectedMemberOwner) && (
        <MenuItem disabled sx={{ justifyContent: "center" }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
            {isSelectedMemberOwner
              ? "Chủ phòng không thể bị xóa"
              : "Chỉ chủ phòng mới có thể xóa thành viên"}
          </Typography>
        </MenuItem>
      )}
    </Menu>
  );
}

export default MemberMenu;