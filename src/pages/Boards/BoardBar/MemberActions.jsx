import {
  Box,
  Button,
  AvatarGroup,
  Avatar,
  Tooltip,
  useTheme,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import GroupIcon from "@mui/icons-material/Group";

function MemberActions({
  activeMembers,
  isOwner,
  loading,
  handleOpenInviteDialog,
  handleOpenManageMembersDialog,
  handleOpenMenu,
}) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const buttonStyle = {
    color: theme.palette.text.primary,
    borderColor: isDarkMode
      ? theme.palette.divider
      : "rgba(255, 255, 255, 0.8)",
    bgcolor: isDarkMode
      ? theme.palette.action.selected
      : "rgba(255, 255, 255, 0.1)",
    textTransform: "none",
    fontWeight: "medium",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: theme.palette.primary.light,
      bgcolor: theme.palette.primary.light,
      color: theme.palette.primary.contrastText,
      transform: "scale(1.05)",
    },
  };

  return (
    <Box
      sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 } }}
    >
      <Button
        variant="outlined"
        sx={buttonStyle}
        startIcon={<PersonAddIcon />}
        onClick={handleOpenInviteDialog}
        size="small"
        disabled={loading || !isOwner}
      >
        Mời
      </Button>
      <Button
        variant="outlined"
        sx={buttonStyle}
        startIcon={<GroupIcon />}
        onClick={handleOpenManageMembersDialog}
        size="small"
      >
        Thành viên
      </Button>
      <AvatarGroup
        max={5}
        total={activeMembers.length}
        sx={{
          "& .MuiAvatar-root": {
            width: { xs: 28, sm: 32 },
            height: { xs: 28, sm: 32 },
            fontSize: { xs: 12, sm: 14 },
            bgcolor: isDarkMode ? theme.palette.primary.dark : "#90CAF9",
            border: `2px solid ${theme.palette.background.paper}`,
            transition: "transform 0.2s ease",
            "&:hover": { transform: "scale(1.1)" },
          },
        }}
      >
        {activeMembers.map((member) => (
          <Tooltip
            key={member.user?._id}
            title={member.user?.fullName || member.user?.email}
          >
            <Avatar
              alt={member.user?.fullName || member.user?.email}
              src={
                member.user?.avatar
                  ? member.user.avatar.startsWith("http")
                    ? member.user.avatar
                    : `http://localhost:5000${member.user.avatar}`
                  : "/static/images/avatar/1.jpg"
              }
              onClick={(event) => handleOpenMenu(event, member)}
              sx={{ cursor: "pointer" }}
            />
          </Tooltip>
        ))}
      </AvatarGroup>
    </Box>
  );
}

export default MemberActions;
