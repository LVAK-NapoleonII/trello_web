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
} from '@mui/material';
import CommentIcon from '@mui/icons-material/Comment';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTheme } from '@mui/material/styles';
import { useMemo } from 'react';
import { normalizeComments } from '../../../../../../../components/utils/normalize'; // Sửa import

const CommentsSection = ({
  comments = [],
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
  const isDarkMode = theme.palette.mode === 'dark';

  // Sử dụng normalizeComments trực tiếp để xử lý tất cả bình luận, bao gồm unknown user
  const visibleComments = useMemo(() => normalizeComments(comments), [comments]);

  const canDeleteComment = (commentUserId) => {
    // Nếu commentUserId null hoặc không hợp lệ, chỉ owner mới xóa được
    if (!currentUserId) return false;
    return currentUserId === commentUserId || isBoardOwner;
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
        Bình luận
      </Typography>

      {visibleComments.length > 0 ? (
        <List dense>
          {visibleComments.map((commentItem, index) => (
            <ListItem
              key={commentItem._id || `comment-${index}`}
              sx={{ py: 0.5 }}
              secondaryAction={
                canDeleteComment(commentItem.user?._id) && (
                  <IconButton
                    edge="end"
                    aria-label="hide"
                    onClick={() => handleHideComment(commentItem._id)}
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
                primary={commentItem.text || 'Bình luận không có nội dung'}
                primaryTypographyProps={{
                  color: isDarkMode
                    ? theme.palette.grey[200]
                    : theme.palette.text.primary,
                }}
                secondary={
                  <>
                    {commentItem.createdAt && commentItem.createdAt !== 'Unknown time'
                      ? new Date(commentItem.createdAt).toLocaleString()
                      : 'Thời gian không xác định'}
                    {' - '}
                    <span
                      style={{
                        textDecoration: isMemberInBoard(commentItem.user?._id)
                          ? 'none'
                          : 'line-through',
                      }}
                    >
                      {commentItem.user?.fullName || 'Người dùng không xác định'}
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

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
          onClick={handleAddComment}
          disabled={loading.comment || !comment?.trim()}
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
          {loading.comment ? <CircularProgress size={20} /> : 'Gửi'}
        </Button>
      </Box>
    </Box>
  );
};

export default CommentsSection;