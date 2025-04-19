import { useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import axios from "axios";

function CommentSection({ card, setCards, setColumns, onExpandChange }) {
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      setError("Bình luận không được để trống!");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/cards/${card._id}/comments`,
        { text: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCards((prevCards) =>
        prevCards.map((c) =>
          c._id === card._id ? { ...c, comments: response.data } : c
        )
      );
      setColumns((prevColumns) =>
        prevColumns.map((col) =>
          col._id === card.list
            ? {
                ...col,
                cards: col.cards.map((c) =>
                  c._id === card._id ? { ...c, comments: response.data } : c
                ),
              }
            : col
        )
      );
      setCommentText("");
      setError(null);
      onExpandChange(true);
    } catch (err) {
      console.error("Error adding comment:", err.response?.data || err.message);
      setError(
        `Có lỗi xảy ra khi thêm bình luận: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!card?.comments?.length && !commentText) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="text.primary" gutterBottom>
        Bình luận
      </Typography>
      <List dense>
        {card?.comments?.map((comment, index) => (
          <ListItem key={index} sx={{ py: 0.5 }}>
            <ListItemText
              primary={comment.text}
              secondary={
                comment.user?.fullName || comment.user?.email || "Người dùng"
              }
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
        <TextField
          label="Thêm bình luận"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          size="small"
          multiline
          rows={2}
          fullWidth
          disabled={loading}
          variant="outlined"
        />
        <Button
          variant="contained"
          size="small"
          onClick={handleAddComment}
          disabled={loading || !commentText.trim()}
        >
          {loading ? <CircularProgress size={20} /> : "Gửi"}
        </Button>
      </Box>
      {error && (
        <Typography color="error" variant="caption" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}

export default CommentSection;
