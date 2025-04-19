import { Menu, MenuItem, Typography, Fade, useTheme } from "@mui/material";

function MemberMenu({
  anchorEl,
  selectedMember,
  isOwner,
  board,
  handleCloseMenu,
  handleRemoveMember,
}) {
  const theme = useTheme();

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
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
        },
      }}
    >
      <MenuItem disabled>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
          {selectedMember?.user?.fullName || selectedMember?.user?.email}
        </Typography>
      </MenuItem>
      {isOwner && selectedMember?.user?._id !== board?.owner?._id && (
        <MenuItem
          onClick={() => handleRemoveMember(selectedMember?.user?._id)}
          sx={{ color: theme.palette.error.main }}
        >
          Xóa khỏi bảng
        </MenuItem>
      )}
    </Menu>
  );
}

export default MemberMenu;
