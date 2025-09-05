import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  CircularProgress,
  IconButton,
} from '@mui/material';
import NoteIcon from '@mui/icons-material/Note';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTheme } from '@mui/material/styles';
import { useMemo } from 'react';
import { normalizeNotes } from "../../../../../../../components/utils/normalize";

const NotesSection = ({
  notes = [],
  note,
  setNote,
  loading,
  handleAddNote,
  handleHideNote,
  isMemberInBoard,
  currentUserId,
  isBoardOwner,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Sử dụng normalizeNotes trực tiếp để xử lý tất cả ghi chú, bao gồm unknown user
  const visibleNotes = useMemo(() => normalizeNotes(notes), [notes]);

  const canDeleteNote = (noteCreatorId) => {
    // Nếu noteCreatorId null hoặc không hợp lệ, chỉ owner mới xóa được
    if (!currentUserId) return false;
    return currentUserId === noteCreatorId || isBoardOwner;
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="h6"
        sx={{
          color: isDarkMode ? theme.palette.grey[200] : theme.palette.text.primary,
          mb: 1,
        }}
      >
        Ghi chú
      </Typography>

      {visibleNotes.length > 0 ? (
        <List dense>
          {visibleNotes.map((noteItem, index) => (
            <ListItem
              key={noteItem._id || `note-${index}`}
              sx={{ py: 0.5 }}
              secondaryAction={
                canDeleteNote(noteItem.createdBy?._id) && (
                  <IconButton
                    edge="end"
                    aria-label="hide"
                    onClick={() => handleHideNote(noteItem._id)}
                    disabled={loading.note}
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
                primary={noteItem.content || 'Ghi chú không có nội dung'}
                primaryTypographyProps={{
                  color: isDarkMode
                    ? theme.palette.grey[200]
                    : theme.palette.text.primary,
                }}
                secondary={
                  <>
                    {noteItem.createdAt && noteItem.createdAt !== 'Unknown time'
                      ? new Date(noteItem.createdAt).toLocaleString()
                      : 'Thời gian không xác định'}
                    {' - '}
                    <span
                      style={{
                        textDecoration: isMemberInBoard(noteItem.createdBy?._id)
                          ? 'none'
                          : 'line-through',
                      }}
                    >
                      {noteItem.createdBy?.fullName || 'Người dùng không xác định'}
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

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
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
            '& .MuiOutlinedInput-root': {
              bgcolor: isDarkMode
                ? 'rgba(255, 255, 255, 0.05)'
                : theme.palette.background.default,
              borderRadius: 2,
              '& fieldset': {
                borderColor: isDarkMode
                  ? theme.palette.grey[600]
                  : theme.palette.divider,
              },
              '&:hover fieldset': {
                borderColor: isDarkMode
                  ? theme.palette.grey[500]
                  : theme.palette.text.secondary,
              },
              '&.Mui-focused fieldset': {
                borderColor: theme.palette.primary.main,
              },
            },
            '& .MuiInputBase-input': {
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
          disabled={loading.note || !note?.trim()}
          sx={{
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            },
            '&:disabled': {
              bgcolor: theme.palette.grey[400],
            },
          }}
        >
          {loading.note ? <CircularProgress size={20} /> : 'Thêm'}
        </Button>
      </Box>
    </Box>
  );
};

export default NotesSection;