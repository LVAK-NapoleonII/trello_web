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

function NoteSection({ card, setCards, setColumns, onExpandChange }) {
  const [noteContent, setNoteContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      setError("Ghi chú không được để trống!");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/cards/${card._id}/notes`,
        { content: noteContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCards((prevCards) =>
        prevCards.map((c) =>
          c._id === card._id ? { ...c, notes: response.data } : c
        )
      );
      setColumns((prevColumns) =>
        prevColumns.map((col) =>
          col._id === card.list
            ? {
                ...col,
                cards: col.cards.map((c) =>
                  c._id === card._id ? { ...c, notes: response.data } : c
                ),
              }
            : col
        )
      );
      setNoteContent("");
      setError(null);
      onExpandChange(true);
    } catch (err) {
      console.error("Error adding note:", err.response?.data || err.message);
      setError(
        `Có lỗi xảy ra khi thêm ghi chú: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!card?.notes?.length && !noteContent) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="text.primary" gutterBottom>
        Ghi chú
      </Typography>
      <List dense>
        {card?.notes?.map((note, index) => (
          <ListItem key={index} sx={{ py: 0.5 }}>
            <ListItemText
              primary={note.content}
              secondary={
                <>
                  {new Date(note.createdAt).toLocaleString()} -{" "}
                  {note.createdBy?.fullName ||
                    note.createdBy?.email ||
                    "Người dùng"}
                </>
              }
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
        <TextField
          label="Thêm ghi chú"
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
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
          onClick={handleAddNote}
          disabled={loading || !noteContent.trim()}
        >
          {loading ? <CircularProgress size={20} /> : "Thêm"}
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

export default NoteSection;
