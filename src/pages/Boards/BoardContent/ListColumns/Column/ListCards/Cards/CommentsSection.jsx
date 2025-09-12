import {
  Box,
  Typography,
  List,
  ListItem,
  TextField,
  IconButton,
  Avatar,
  Paper,
  Fade,
  Collapse,
  Chip,
} from '@mui/material';
import CommentIcon from '@mui/icons-material/Comment';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTheme } from '@mui/material/styles';
import { useMemo, useState, useRef, useEffect } from 'react';
import { normalizeComments } from '../../../../../../../components/utils/normalize';

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
  card,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const messagesEndRef = useRef(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const isCardMember = card?.members?.some((m) => m._id.toString() === currentUserId) || false;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isCollapsed) {
      // Delay scroll to allow for animations
      const timer = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [comments, isCollapsed]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  if (!isCardMember && !isBoardOwner) {
    return (
      <Paper
        variant="outlined"
        sx={{
          mb: 2,
          borderRadius: 2,
          p: 2,
          textAlign: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <CommentIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Bạn không phải thành viên của thẻ này
        </Typography>
      </Paper>
    );
  }

  const visibleComments = useMemo(() => {
    // Sort comments by createdAt to ensure chronological order (oldest first, newest at bottom)
    const normalized = normalizeComments(comments);
    return normalized.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [comments]);

  const canDeleteComment = (commentUserId) => {
    if (!currentUserId) return false;
    return currentUserId === commentUserId || isBoardOwner;
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (comment.trim() && !loading.comment) {
        handleAddComment();
      }
    }
  };

  const formatTime = (dateString) => {
    if (!dateString || dateString === 'Unknown time') return 'Không xác định';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins}p`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        mb: 2,
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {/* Compact Header */}
      <Box
        sx={{
          p: 1.5,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 48,
          '&:hover': {
            bgcolor: 'action.hover',
          }
        }}
        onClick={toggleCollapse}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CommentIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
            }}
          >
            Bình luận
          </Typography>
          {visibleComments.length > 0 && (
            <Chip
              label={visibleComments.length}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                bgcolor: 'primary.main',
                color: 'white',
                '& .MuiChip-label': { px: 1 }
              }}
            />
          )}
        </Box>
        <IconButton
          size="small"
          sx={{
            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.2s',
          }}
        >
          <ExpandMoreIcon fontSize="small" />
        </IconButton>
      </Box>

      <Collapse in={!isCollapsed}>
        {/* Compact Messages Container */}
        <Box sx={{
          maxHeight: 280,
          minHeight: 100,
          overflowY: 'auto',
          px: 2,
          py: 1,
          bgcolor: 'grey.50',
          ...(isDarkMode && { bgcolor: 'grey.900' }),
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'grey.400',
            borderRadius: '2px',
          },
        }}>
          {visibleComments.length > 0 ? (
            <>
              <List dense sx={{ p: 0 }}>
                {visibleComments.map((commentItem, index) => {
                  const isOwnComment = commentItem.user?._id === currentUserId;

                  return (
                    <Fade in timeout={200 + index * 30} key={commentItem._id || `comment-${index}`}>
                      <ListItem
                        sx={{
                          p: 0,
                          mb: 1.5,
                          display: 'flex',
                          justifyContent: isOwnComment ? 'flex-end' : 'flex-start',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Box sx={{
                          display: 'flex',
                          flexDirection: isOwnComment ? 'row-reverse' : 'row',
                          alignItems: 'flex-end',
                          gap: 1,
                          maxWidth: '85%',
                          position: 'relative',
                        }}>
                          {/* Compact Avatar */}
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              fontSize: '0.75rem',
                              bgcolor: isOwnComment ? 'primary.main' : 'secondary.main',
                              flexShrink: 0,
                            }}
                          >
                            {(commentItem.user?.fullName || 'U').charAt(0).toUpperCase()}
                          </Avatar>

                          {/* Compact Message Bubble */}
                          <Box sx={{ position: 'relative', minWidth: 0 }}>
                            {/* Compact Message */}
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1.5,
                                bgcolor: isOwnComment ? 'primary.main' : 'background.paper',
                                color: isOwnComment ? 'primary.contrastText' : 'text.primary',
                                borderRadius: 2,
                                borderBottomRightRadius: isOwnComment ? 0.5 : 2,
                                borderBottomLeftRadius: isOwnComment ? 2 : 0.5,
                                border: isOwnComment ? 'none' : '1px solid',
                                borderColor: 'divider',
                                maxWidth: '100%',
                                minWidth: 0,
                                wordWrap: 'break-word',
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: '0.85rem',
                                  lineHeight: 1.4,
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                  mb: 0.5,
                                }}
                              >
                                {commentItem.text || 'Không có nội dung'}
                              </Typography>

                              {/* Compact metadata */}
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.7rem',
                                  opacity: 0.8,
                                  display: 'block',
                                }}
                              >
                                <span
                                  style={{
                                    textDecoration: isMemberInBoard(commentItem.user?._id)
                                      ? 'none'
                                      : 'line-through',
                                  }}
                                >
                                  {commentItem.user?.fullName || 'Không xác định'}
                                </span>
                                {' • '}
                                {formatTime(commentItem.createdAt)}
                              </Typography>
                            </Paper>

                            {/* Improved Delete button positioning */}
                            {canDeleteComment(commentItem.user?._id) && (
                              <IconButton
                                size="small"
                                onClick={() => handleHideComment(commentItem._id)}
                                disabled={loading.comment}
                                sx={{
                                  position: 'absolute',
                                  top: -8,
                                  right: isOwnComment ? -8 : 'auto',
                                  left: isOwnComment ? 'auto' : -8,
                                  width: 22,
                                  height: 22,
                                  bgcolor: 'error.main',
                                  color: 'white',
                                  '&:hover': {
                                    bgcolor: 'error.dark',
                                    transform: 'scale(1.1)',
                                  },
                                  '&:disabled': {
                                    bgcolor: 'action.disabledBackground',
                                  },
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                      </ListItem>
                    </Fade>
                  );
                })}
              </List>
              {/* Scroll anchor for new messages */}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 80,
            }}>
              <CommentIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Chưa có bình luận nào
              </Typography>
            </Box>
          )}
        </Box>
        {/* Compact Input Area - Moved to top */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
            bgcolor: 'background.default',
            borderRadius: 2,
            p: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Viết bình luận..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyPress={handleKeyPress}
              variant="standard"
              disabled={loading.comment}
              multiline
              maxRows={3}
              InputProps={{ disableUnderline: true }}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: '0.85rem',
                  p: 1,
                },
              }}
            />
            <IconButton
              size="small"
              onClick={handleAddComment}
              disabled={loading.comment || !comment?.trim()}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                width: 32,
                height: 32,
                flexShrink: 0,
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '&:disabled': {
                  bgcolor: 'action.disabledBackground',
                },
              }}
            >
              {loading.comment ? (
                <Box sx={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      border: '2px solid currentColor',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                </Box>
              ) : (
                <SendIcon sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default CommentsSection;