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
import NoteIcon from "@mui/icons-material/Note";

const NotesSection = ({
  notes,
  note,
  setNote,
  loading,
  handleAddNote,
  isMemberInBoard,
}) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="h6" color="text.primary" gutterBottom>
      Ghi chú
    </Typography>
    {notes?.length > 0 && (
      <List dense>
        {notes.map((note, index) => (
          <ListItem key={index} sx={{ py: 0.5 }}>
            <ListItemText
              primary={note.content}
              primaryTypographyProps={{ color: "text.primary" }}
              secondary={
                <>
                  {new Date(note.createdAt).toLocaleString()} -{" "}
                  <span
                    style={{
                      textDecoration: !isMemberInBoard(note.createdBy?._id)
                        ? "line-through"
                        : "none",
                    }}
                  >
                    {note.createdBy?.fullName || "Không xác định"}
                  </span>
                </>
              }
              secondaryTypographyProps={{ color: "text.secondary" }}
            />
          </ListItem>
        ))}
      </List>
    )}
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
      <NoteIcon fontSize="small" color="action" />
      <TextField
        fullWidth
        size="small"
        placeholder="Thêm ghi chú..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        variant="outlined"
        disabled={loading.note}
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
        onClick={handleAddNote}
        disabled={loading.note || !note.trim()}
        sx={{
          bgcolor: "primary.main",
          "&:hover": {
            bgcolor: "primary.dark",
          },
        }}
      >
        {loading.note ? <CircularProgress size={20} /> : "Thêm"}
      </Button>
    </Box>
  </Box>
);

export default NotesSection;
