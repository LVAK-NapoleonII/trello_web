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
  onlineUsers,
  handleCloseInviteDialog,
  handleInviteMember,
}) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const uniqueSearchResults = Array.from(
    new Map(searchResults.map((user) => [user._id, user])).values()
  );
  const uniquePastMembersAndInvited = Array.from(
    new Map(
      pastMembersAndInvited.map((entry) => [entry.user?._id, entry])
    ).values()
  );

  return (
    <Dialog
      open={open}
      onClose={handleCloseInviteDialog}
      TransitionComponent={Fade}
      fullWidth
      maxWidth="md"
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
        <PersonAddIcon />
        <Typography variant="h6" fontWeight={600}>
          Invite to "{board?.title}"
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
          <TextField
            autoFocus
            fullWidth
            label="Search by email or name"
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
                borderRadius: 10,
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
        {(uniqueSearchResults.length > 0 || uniquePastMembersAndInvited.length > 0) && (
          <Box
            sx={{
              maxHeight: 400,
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
            {uniqueSearchResults.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  sx={{ color: theme.palette.text.primary, mb: 1.5 }}
                >
                  Search Results
                </Typography>
                <List dense>
                  {uniqueSearchResults.map((user) => {
                    const isOnline =
                      onlineUsers &&
                      (onlineUsers.has(user._id) || user.isOnline);
                    return (
                      <ListItem
                        key={user._id}
                        disablePadding
                        sx={{
                          borderRadius: 10,
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
                          transition: "all 0.3s ease",
                        }}
                      >
                        <ListItemButton
                          onClick={() => {
                            setSelectedUserId(user._id);
                            setSearchQuery(user.email || user.fullName);
                          }}
                          sx={{ py: 1.5, borderRadius: 10 }}
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
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 0.5,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography
                                variant="body1"
                                fontWeight={500}
                                color={theme.palette.text.primary}
                              >
                                {user.fullName || user.email}{" "}
                                {isOnline ? "(Online)" : "(Offline)"}
                              </Typography>
                              {user.isPastMember && (
                                <Chip
                                  label="Left"
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
                                  label="Invited"
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
                            <Typography
                              variant="body2"
                              color={theme.palette.text.secondary}
                            >
                              {user.email}
                            </Typography>
                          </Box>
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}
            {uniquePastMembersAndInvited.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  sx={{ color: theme.palette.text.primary, mb: 1.5 }}
                >
                  Past Members or Invited
                </Typography>
                <List dense>
                  {uniquePastMembersAndInvited.map((entry) => {
                    const isOnline =
                      onlineUsers &&
                      (onlineUsers.has(entry.user?._id) ||
                        entry.user?.isOnline);
                    return (
                      <ListItem
                        key={entry.user?._id}
                        disablePadding
                        sx={{
                          borderRadius: 10,
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
                          transition: "all 0.3s ease",
                        }}
                      >
                        <ListItemButton
                          onClick={() => {
                            setSelectedUserId(entry.user?._id);
                            setSearchQuery(
                              entry.user?.email || entry.user?.fullName
                            );
                          }}
                          sx={{ py: 1.5, borderRadius: 10 }}
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
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 0.5,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography
                                variant="body1"
                                fontWeight={500}
                                color={theme.palette.text.primary}
                              >
                                {entry.user?.fullName || entry.user?.email}{" "}
                                {isOnline ? "(Online)" : "(Offline)"}
                              </Typography>
                              {!entry.isActive && (
                                <Chip
                                  label="Left"
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
                                  label="Invited"
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
                            <Typography
                              variant="body2"
                              color={theme.palette.text.secondary}
                            >
                              {entry.user?.email}
                            </Typography>
                          </Box>
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}
          </Box>
        )}
        {uniqueSearchResults.length === 0 &&
          uniquePastMembersAndInvited.length === 0 &&
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
              No matching users found.
            </Typography>
          )}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
            <CircularProgress sx={{ color: theme.palette.primary.main }} />
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
          Cancel
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
            borderRadius: 8,
            padding: "6px 16px",
            "&:hover": {
              bgcolor: theme.palette.primary.dark,
              transform: "translateY(-2px)",
              boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
            },
            transition: "all 0.3s ease",
          }}
        >
          {loading ? "Processing..." : "Invite"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default InviteDialog;