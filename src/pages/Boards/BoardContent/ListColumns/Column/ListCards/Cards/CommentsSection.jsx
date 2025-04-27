import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Divider,
  CircularProgress,
  IconButton,
} from "@mui/material";
import CommentIcon from "@mui/icons-material/Comment";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTheme } from "@mui/material/styles";

const CommentsSection = ({
  comments,
  comment,
  setComment,
  loading,
  handleAddComment,
  handleHideComment,
  isMemberInBoard,
  currentUserId,
  isBoardOwner,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // Filter out deleted comments
  const visibleComments = comments.filter((c) => !c.isDeleted);

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="h6"
        sx={{
          color: isDarkMode
            ? theme.palette.grey[200]
            : theme.palette.text.primary,
          mb: 1,
        }}
      >
        Bình luận
      </Typography>
      {visibleComments?.length > 0 ? (
        <List dense>
          {visibleComments.map((comment, index) => (
            <ListItem
              key={comment._id || index}
              sx={{ py: 0.5 }}
              secondaryAction={
                (currentUserId === comment.user?._id || isBoardOwner) && (
                  <IconButton
                    edge="end"
                    aria-label="hide"
                    onClick={() => handleHideComment(comment._id)}
                    disabled={loading.comment}
                    sx={{
                      color: isDarkMode
                        ? theme.palette.grey[400]
                        : theme.palette.text.secondary,
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )
              }
            >
              <ListItemText
                primary={comment.text}
                primaryTypographyProps={{
                  color: isDarkMode
                    ? theme.palette.grey[200]
                    : theme.palette.text.primary,
                }}
                secondary={
                  <>
                    {new Date(comment.createdAt).toLocaleString()} -{" "}
                    <span
                      style={{
                        textDecoration: !isMemberInBoard(comment.user?._id)
                          ? "line-through"
                          : "none",
                      }}
                    >
                      {comment.user?.fullName || "Không xác định"}
                    </span>
                  </>
                }
                secondaryTypographyProps={{
                  color: isDarkMode
                    ? theme.palette.grey[400]
                    : theme.palette.text.secondary,
                }}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography
          sx={{
            color: isDarkMode
              ? theme.palette.grey[400]
              : theme.palette.text.secondary,
            mb: 2,
          }}
        >
          Chưa có bình luận nào.
        </Typography>
      )}
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CommentIcon
          fontSize="small"
          sx={{
            color: isDarkMode
              ? theme.palette.grey[400]
              : theme.palette.action.active,
          }}
        />
        <TextField
          fullWidth
          size="small"
          placeholder="Viết bình luận..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          variant="outlined"
          disabled={loading.comment}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: isDarkMode
                ? "rgba(255, 255, 255, 0.05)"
                : theme.palette.background.default,
              borderRadius: 2,
              "& fieldset": {
                borderColor: isDarkMode
                  ? theme.palette.grey[600]
                  : theme.palette.divider,
              },
              "&:hover fieldset": {
                borderColor: isDarkMode
                  ? theme.palette.grey[500]
                  : theme.palette.text.secondary,
              },
              "&.Mui-focused fieldset": {
                borderColor: theme.palette.primary.main,
              },
            },
            "& .MuiInputBase-input": {
              color: isDarkMode
                ? theme.palette.grey[200]
                : theme.palette.text.primary,
            },
          }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={handleAddComment}
          disabled={loading.comment || !comment.trim()}
          sx={{
            bgcolor: theme.palette.primary.main,
            "&:hover": {
              bgcolor: theme.palette.primary.dark,
            },
            "&:disabled": {
              bgcolor: theme.palette.grey[400],
            },
          }}
        >
          {loading.comment ? <CircularProgress size={20} /> : "Gửi"}
        </Button>
      </Box>
    </Box>
  );
};

export default CommentsSection;
