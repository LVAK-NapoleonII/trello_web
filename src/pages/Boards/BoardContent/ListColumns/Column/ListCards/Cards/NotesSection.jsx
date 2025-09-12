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
  Collapse,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import NoteIcon from '@mui/icons-material/Note';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import { useTheme } from '@mui/material/styles';
import { useMemo, useState } from 'react';
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
  const [expanded, setExpanded] = useState(false);

  const visibleNotes = useMemo(() => normalizeNotes(notes), [notes]);

  const canDeleteNote = (noteCreatorId) => {
    if (!currentUserId) return false;
    return currentUserId === noteCreatorId || isBoardOwner;
  };

  const handleExpandToggle = () => {
    setExpanded(!expanded);
  };

  const noteCount = visibleNotes.length;

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        '&:hover': {
          boxShadow: 1,
        }
      }}
    >
      {/* Compact Header */}
      <Box
        onClick={handleExpandToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          cursor: 'pointer',
          minHeight: 48,
          '&:hover': {
            bgcolor: 'action.hover',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <NoteIcon
            sx={{
              color: 'secondary.main',
              fontSize: 20
            }}
          />
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
            }}
          >
            Ghi chú
          </Typography>
          {noteCount > 0 && (
            <Chip
              label={noteCount}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                bgcolor: 'secondary.main',
                color: 'white',
                '& .MuiChip-label': { px: 1 }
              }}
            />
          )}
        </Box>
        <IconButton
          size="small"
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <ExpandMoreIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content */}
      <Collapse in={expanded}>
        <CardContent sx={{ pt: 0, p: 2 }}>
          {/* Notes List */}
          {visibleNotes.length > 0 ? (
            <List dense sx={{ mb: 2, p: 0 }}>
              {visibleNotes.map((noteItem, index) => (
                <ListItem
                  key={noteItem._id || `note-${index}`}
                  sx={{
                    py: 1,
                    px: 1.5,
                    mb: 1,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                  secondaryAction={
                    canDeleteNote(noteItem.createdBy?._id) && (
                      <IconButton
                        size="small"
                        onClick={() => handleHideNote(noteItem._id)}
                        disabled={loading.note}
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            color: 'error.main',
                          }
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
                      variant: 'body2',
                      sx: { fontWeight: 500 }
                    }}
                    secondary={
                      <>
                        {noteItem.createdAt && noteItem.createdAt !== 'Unknown time'
                          ? new Date(noteItem.createdAt).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                          : 'Không xác định'}
                        {' • '}
                        <span
                          style={{
                            textDecoration: isMemberInBoard(noteItem.createdBy?._id)
                              ? 'none'
                              : 'line-through',
                            color: isMemberInBoard(noteItem.createdBy?._id)
                              ? 'inherit'
                              : theme.palette.error.main,
                          }}
                        >
                          {noteItem.createdBy?.fullName || 'Không xác định'}
                        </span>
                      </>
                    }
                    secondaryTypographyProps={{
                      variant: 'caption',
                      color: 'text.secondary',
                    }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                textAlign: 'center',
                py: 2,
                fontStyle: 'italic',
              }}
            >
              Chưa có ghi chú nào
            </Typography>
          )}

          {/* Add Note - Compact */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Thêm ghi chú..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={loading.note}
              multiline
              maxRows={2}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.default',
                },
              }}
            />
            <IconButton
              color="secondary"
              onClick={handleAddNote}
              disabled={loading.note || !note?.trim()}
              sx={{
                bgcolor: 'secondary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'secondary.dark',
                },
                '&:disabled': {
                  bgcolor: 'action.disabledBackground',
                },
              }}
            >
              {loading.note ?
                <CircularProgress size={16} color="inherit" /> :
                <AddIcon fontSize="small" />
              }
            </IconButton>
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default NotesSection;