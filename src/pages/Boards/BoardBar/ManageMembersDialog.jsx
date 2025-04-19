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

function ManageMembersDialog({
  open,
  board,
  activeMembers,
  isOwner,
  loading,
  handleCloseManageMembersDialog,
  handleRemoveMember,
  handleLeaveBoard,
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
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <GroupIcon />
        Quản lý thành viên
      </DialogTitle>
      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Paper
          elevation={2}
          sx={{
            p: 2,
            mb: 2,
            bgcolor: theme.palette.background.default,
            borderRadius: 2,
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            sx={{ color: theme.palette.text.primary, mb: 1.5 }}
          >
            Danh sách thành viên ({activeMembers.length})
          </Typography>
          <List
            dense
            sx={{
              maxHeight: 300,
              overflowY: "auto",
              "&::-webkit-scrollbar": {
                width: 8,
              },
              "&::-webkit-scrollbar-track": {
                bgcolor: theme.palette.divider,
                borderRadius: 4,
              },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: theme.palette.primary.main,
                borderRadius: 4,
              },
            }}
          >
            {activeMembers.map((member) => (
              <ListItem
                key={member.user?._id}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  "&:hover": { bgcolor: theme.palette.action.hover },
                  transition: "all 0.2s ease",
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
                    sx={{ width: 40, height: 40 }}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={member.user?.fullName || member.user?.email}
                  secondary={
                    member.user?._id === board?.owner?._id
                      ? "Chủ phòng"
                      : "Thành viên"
                  }
                  primaryTypographyProps={{
                    variant: "body1",
                    fontWeight: "medium",
                    color: theme.palette.text.primary,
                  }}
                  secondaryTypographyProps={{
                    variant: "body2",
                    color: theme.palette.text.secondary,
                  }}
                />
                <ListItemSecondaryAction>
                  {isOwner && member.user?._id !== board?.owner?._id && (
                    <Tooltip title="Xóa khỏi bảng">
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveMember(member.user?._id)}
                        sx={{ color: theme.palette.error.main }}
                        disabled={loading}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
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
                "&:hover": {
                  bgcolor: theme.palette.error.light,
                  borderColor: theme.palette.error.dark,
                },
              }}
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Rời khỏi bảng"}
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
            borderColor: theme.palette.divider,
            color: theme.palette.text.primary,
            "&:hover": {
              borderColor: theme.palette.primary.light,
              bgcolor: theme.palette.action.hover,
            },
          }}
        >
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ManageMembersDialog;
