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
} from "@mui/material";
import CommentIcon from "@mui/icons-material/Comment";

const CommentsSection = ({
  comments,
  comment,
  setComment,
  loading,
  handleAddComment,
  isMemberInBoard,
}) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="h6" color="text.primary" gutterBottom>
      Bình luận
    </Typography>
    {comments?.length > 0 && (
      <List dense>
        {comments.map((comment, index) => (
          <ListItem key={index} sx={{ py: 0.5 }}>
            <ListItemText
              primary={comment.text}
              primaryTypographyProps={{ color: "text.primary" }}
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
              secondaryTypographyProps={{ color: "text.secondary" }}
            />
          </ListItem>
        ))}
      </List>
    )}
    <Divider sx={{ my: 2 }} />
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <CommentIcon fontSize="small" color="action" />
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
            bgcolor: "background.default",
            borderRadius: 2,
            "& fieldset": {
              borderColor: "divider",
            },
            "&:hover fieldset": {
              borderColor: "text.secondary",
            },
          },
        }}
      />
      <Button
        variant="contained"
        size="small"
        onClick={handleAddComment}
        disabled={loading.comment || !comment.trim()}
        sx={{
          bgcolor: "primary.main",
          "&:hover": {
            bgcolor: "primary.dark",
          },
        }}
      >
        {loading.comment ? <CircularProgress size={20} /> : "Gửi"}
      </Button>
    </Box>
  </Box>
);

export default CommentsSection;
