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
    borderColor: isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
    bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.6)",
    textTransform: "none",
    fontWeight: 500,
    fontSize: "0.9rem",
    padding: "6px 16px",
    borderRadius: 8,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      borderColor: theme.palette.primary.main,
      bgcolor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      transform: "translateY(-2px)",
      boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
    },
    "&:disabled": {
      bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
      color: theme.palette.text.disabled,
    },
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 1, sm: 1.5 },
        padding: 1,
        borderRadius: 12,
        bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.4)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Button
        variant="outlined"
        sx={buttonStyle}
        startIcon={<PersonAddIcon />}
        onClick={handleOpenInviteDialog}
        size="small"
        disabled={loading || !isOwner}
      >
        Invite
      </Button>
      <Button
        variant="outlined"
        sx={buttonStyle}
        startIcon={<GroupIcon />}
        onClick={handleOpenManageMembersDialog}
        size="small"
      >
        Members
      </Button>
      <AvatarGroup
        max={5}
        total={activeMembers.length}
        sx={{
          "& .MuiAvatar-root": {
            width: { xs: 32, sm: 36 },
            height: { xs: 32, sm: 36 },
            fontSize: { xs: 14, sm: 16 },
            bgcolor: isDarkMode ? theme.palette.primary.dark : theme.palette.primary.light,
            border: `2px solid ${theme.palette.background.paper}`,
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
            },
          },
        }}
      >
        {activeMembers.map((member) => (
          <Tooltip
            key={member.user?._id}
            title={member.user?.fullName || member.user?.email}
            arrow
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