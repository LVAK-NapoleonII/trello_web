import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  CircularProgress,
  InputAdornment,
  Fade,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SearchIcon from "@mui/icons-material/Search";

function InviteDialog({
  open,
  board,
  searchQuery,
  setSearchQuery,
  searchResults,
  pastMembersAndInvited,
  loading,
  selectedUserId,
  setSelectedUserId,
  handleCloseInviteDialog,
  handleInviteMember,
}) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  return (
    <Dialog
      open={open}
      onClose={handleCloseInviteDialog}
      TransitionComponent={Fade}
      fullWidth
      maxWidth="md"
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
        <PersonAddIcon />
        Mời thành viên vào bảng "{board?.title}"
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
          <TextField
            autoFocus
            fullWidth
            label="Tìm kiếm bằng email hoặc tên"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              ),
              endAdornment: loading ? (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ) : null,
            }}
            variant="outlined"
            size="medium"
            disabled={loading}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: theme.palette.background.paper,
                "&:hover fieldset": {
                  borderColor: theme.palette.primary.light,
                },
                "&.Mui-focused fieldset": {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        </Paper>
        {(searchResults.length > 0 || pastMembersAndInvited.length > 0) && (
          <Box
            sx={{
              maxHeight: 400,
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
            {searchResults.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{ color: theme.palette.text.primary, mb: 1.5 }}
                >
                  Kết quả tìm kiếm
                </Typography>
                <List dense>
                  {searchResults.map((user) => (
                    <ListItem
                      key={user._id}
                      disablePadding
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        bgcolor:
                          selectedUserId === user._id
                            ? theme.palette.action.selected
                            : "transparent",
                        "&:hover": {
                          bgcolor:
                            selectedUserId === user._id
                              ? theme.palette.action.selected
                              : theme.palette.action.hover,
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      <ListItemButton
                        onClick={() => {
                          setSelectedUserId(user._id);
                          setSearchQuery(user.email || user.fullName);
                        }}
                        sx={{ py: 1.5 }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            src={
                              user.avatar
                                ? user.avatar.startsWith("http")
                                  ? user.avatar
                                  : `http://localhost:5000${user.avatar}`
                                : "/static/images/avatar/1.jpg"
                            }
                            sx={{ width: 40, height: 40 }}
                          />
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              {user.fullName || user.email}
                              {user.isPastMember && (
                                <Chip
                                  label="Đã rời"
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                  sx={{
                                    fontSize: 12,
                                    bgcolor: isDarkMode
                                      ? theme.palette.warning.dark
                                      : theme.palette.warning.light,
                                    color: theme.palette.warning.contrastText,
                                  }}
                                />
                              )}
                              {user.isInvited && (
                                <Chip
                                  label="Đã mời"
                                  size="small"
                                  color="info"
                                  variant="outlined"
                                  sx={{
                                    fontSize: 12,
                                    bgcolor: isDarkMode
                                      ? theme.palette.info.dark
                                      : theme.palette.info.light,
                                    color: theme.palette.info.contrastText,
                                  }}
                                />
                              )}
                            </Box>
                          }
                          secondary={user.email}
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
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            {pastMembersAndInvited.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{ color: theme.palette.text.primary, mb: 1.5 }}
                >
                  Thành viên cũ hoặc đã được mời
                </Typography>
                <List dense>
                  {pastMembersAndInvited.map((entry) => (
                    <ListItem
                      key={entry.user?._id}
                      disablePadding
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        bgcolor:
                          selectedUserId === entry.user?._id
                            ? theme.palette.action.selected
                            : "transparent",
                        "&:hover": {
                          bgcolor:
                            selectedUserId === entry.user?._id
                              ? theme.palette.action.selected
                              : theme.palette.action.hover,
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      <ListItemButton
                        onClick={() => {
                          setSelectedUserId(entry.user?._id);
                          setSearchQuery(
                            entry.user?.email || entry.user?.fullName
                          );
                        }}
                        sx={{ py: 1.5 }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            src={
                              entry.user?.avatar
                                ? entry.user.avatar.startsWith("http")
                                  ? entry.user.avatar
                                  : `http://localhost:5000${entry.user.avatar}`
                                : "/static/images/avatar/1.jpg"
                            }
                            sx={{ width: 40, height: 40 }}
                          />
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              {entry.user?.fullName || entry.user?.email}
                              {!entry.isActive && (
                                <Chip
                                  label="Đã rời"
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                  sx={{
                                    fontSize: 12,
                                    bgcolor: isDarkMode
                                      ? theme.palette.warning.dark
                                      : theme.palette.warning.light,
                                    color: theme.palette.warning.contrastText,
                                  }}
                                />
                              )}
                              {entry.isActive && (
                                <Chip
                                  label="Đã mời"
                                  size="small"
                                  color="info"
                                  variant="outlined"
                                  sx={{
                                    fontSize: 12,
                                    bgcolor: isDarkMode
                                      ? theme.palette.info.dark
                                      : theme.palette.info.light,
                                    color: theme.palette.info.contrastText,
                                  }}
                                />
                              )}
                            </Box>
                          }
                          secondary={entry.user?.email}
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
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}
        {searchResults.length === 0 &&
          pastMembersAndInvited.length === 0 &&
          !loading &&
          searchQuery.trim() && (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                mt: 2,
                textAlign: "center",
              }}
            >
              Không tìm thấy người dùng nào phù hợp.
            </Typography>
          )}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
            <CircularProgress
              sx={{ size: "32", color: theme.palette.primary.main }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button
          onClick={handleCloseInviteDialog}
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
          Hủy
        </Button>
        <Button
          onClick={handleInviteMember}
          variant="contained"
          size="medium"
          disabled={loading || (!searchQuery.trim() && !selectedUserId)}
          startIcon={
            loading ? <CircularProgress size={16} /> : <PersonAddIcon />
          }
          sx={{
            textTransform: "none",
            bgcolor: theme.palette.primary.main,
            "&:hover": {
              bgcolor: theme.palette.primary.dark,
              transform: "scale(1.05)",
            },
            transition: "all 0.2s ease",
          }}
        >
          {loading ? "Đang xử lý..." : "Mời"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default InviteDialog;
