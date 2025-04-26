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
import { useTheme } from "@mui/material/styles";

const NotesSection = ({
  notes,
  note,
  setNote,
  loading,
  handleAddNote,
  isMemberInBoard,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

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
        Ghi chú
      </Typography>
      {notes?.length > 0 ? (
        <List dense>
          {notes.map((note, index) => (
            <ListItem key={index} sx={{ py: 0.5 }}>
              <ListItemText
                primary={note.content}
                primaryTypographyProps={{
                  color: isDarkMode
                    ? theme.palette.grey[200]
                    : theme.palette.text.primary,
                }}
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
          Chưa có ghi chú nào.
        </Typography>
      )}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
        <NoteIcon
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
          placeholder="Thêm ghi chú..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          variant="outlined"
          disabled={loading.note}
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
          onClick={handleAddNote}
          disabled={loading.note || !note.trim()}
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
          {loading.note ? <CircularProgress size={20} /> : "Thêm"}
        </Button>
      </Box>
    </Box>
  );
};

export default NotesSection;
