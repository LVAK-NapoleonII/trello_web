import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Tooltip,
  Fade,
  useTheme,
} from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import DeleteIcon from "@mui/icons-material/Delete";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import TransferIcon from "@mui/icons-material/AssignmentInd";


function ManageMembersDialog({
  open,
  board,
  activeMembers,
  isOwner,
  loading,
  onlineUsers,
  handleCloseManageMembersDialog,
  handleRemoveMember,
  handleLeaveBoard,
  handleTransferOwnership,
}) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  return (
    <Dialog
      open={open}
      onClose={handleCloseManageMembersDialog}
      TransitionComponent={Fade}
      fullWidth
      maxWidth="sm"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 12,
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
          boxShadow: `0 8px 32px ${isDarkMode ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.15)"}`,
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: theme.palette.primary.contrastText,
          py: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }}
      >
        <GroupIcon />
        <Typography variant="h6" fontWeight={600}>
          Manage Members
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.6)",
            borderRadius: 12,
            border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
            backdropFilter: "blur(10px)",
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{ color: theme.palette.text.primary, mb: 1.5 }}
          >
            Members ({activeMembers.length})
          </Typography>
          <List
            dense
            sx={{
              maxHeight: 300,
              overflowY: "auto",
              "&::-webkit-scrollbar": {
                width: 6,
              },
              "&::-webkit-scrollbar-track": {
                bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                borderRadius: 3,
              },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: theme.palette.primary.main,
                borderRadius: 3,
              },
            }}
          >
            {activeMembers.map((member) => {
              const isOnline =
                onlineUsers &&
                (onlineUsers.has(member.user?._id) || member.user?.isOnline);
              return (
                <ListItem
                  key={member.user?._id}
                  sx={{
                    borderRadius: 10,
                    mb: 0.5,
                    "&:hover": { bgcolor: theme.palette.action.hover },
                    transition: "all 0.3s ease",
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={
                        member.user?.avatar
                          ? member.user.avatar.startsWith("http")
                            ? member.user.avatar
                            : `http://localhost:5000${member.user.avatar}`
                          : "/static/images/avatar/1.jpg"
                      }
                      sx={{
                        width: 40,
                        height: 40,
                        border: `2px solid ${isOnline
                          ? theme.palette.success.main
                          : theme.palette.grey[500]
                          } !important`,
                      }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${member.user?.fullName || member.user?.email} ${isOnline ? "(Online)" : "(Offline)"
                      }`}
                    secondary={
                      member.user?._id === board?.owner?._id
                        ? "Chủ phòng"
                        : "Thành viên"
                    }
                    primaryTypographyProps={{
                      variant: "body1",
                      fontWeight: 500,
                      color: theme.palette.text.primary,
                    }}
                    secondaryTypographyProps={{
                      variant: "body2",
                      color: theme.palette.text.secondary,
                    }}
                  />
                  <ListItemSecondaryAction>
                    {isOwner && member.user?._id !== board?.owner?._id && (
                      <>
                        <Tooltip title="Remove from board">
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveMember(member.user?._id)}
                            sx={{
                              color: theme.palette.error.main,
                              "&:hover": {
                                bgcolor: theme.palette.error.light + "20",
                              },
                            }}
                            disabled={loading}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Transfer ownership">
                          <IconButton
                            edge="end"
                            onClick={() => handleTransferOwnership(member.user?._id)} // Hàm mới
                            sx={{
                              color: theme.palette.primary.main,
                              "&:hover": {
                                bgcolor: theme.palette.primary.light + "20",
                              },
                            }}
                            disabled={loading}
                          >
                            <TransferIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
          {!isOwner && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<ExitToAppIcon />}
              onClick={handleLeaveBoard}
              sx={{
                mt: 2,
                width: "100%",
                textTransform: "none",
                borderColor: theme.palette.error.main,
                color: theme.palette.error.main,
                borderRadius: 8,
                padding: "6px 16px",
                "&:hover": {
                  bgcolor: theme.palette.error.light + "20",
                  borderColor: theme.palette.error.dark,
                  transform: "translateY(-2px)",
                },
                transition: "all 0.3s ease",
              }}
              disabled={loading}
            >
              {loading ? "Processing..." : "Leave Board"}
            </Button>
          )}
        </Paper>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button
          onClick={handleCloseManageMembersDialog}
          variant="outlined"
          size="medium"
          disabled={loading}
          sx={{
            textTransform: "none",
            borderColor: isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
            color: theme.palette.text.primary,
            borderRadius: 8,
            padding: "6px 16px",
            "&:hover": {
              borderColor: theme.palette.primary.light,
              bgcolor: theme.palette.action.hover,
              transform: "translateY(-2px)",
            },
            transition: "all 0.3s ease",
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ManageMembersDialog;