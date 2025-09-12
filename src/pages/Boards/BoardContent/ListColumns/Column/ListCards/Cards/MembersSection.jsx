import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Tooltip,
  Chip,
  AvatarGroup,
  Collapse,
  Card,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GroupIcon from '@mui/icons-material/Group';
import { useTheme } from '@mui/material/styles';

function MembersSection({
  members,
  boardMembers,
  isBoardOwner,
  loading,
  handleRemoveMember,
  setOpenAddMemberDialog,
  isMemberInBoard,
}) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [expanded, setExpanded] = useState(false);

  // Loại bỏ trùng lặp trong members và kiểm tra dữ liệu hợp lệ
  const uniqueMembers = Array.isArray(members)
    ? members
      .filter((m) => m && m._id && typeof m._id === 'string')
      .filter(
        (m, index, self) =>
          self.findIndex((x) => x._id.toString() === m._id.toString()) === index
      )
    : [];

  const activeMembersCount = uniqueMembers.filter((member) => {
    const isActive = typeof isMemberInBoard === 'function' && member._id
      ? isMemberInBoard(member._id)
      : member.isActive !== false;
    return isActive;
  }).length;

  const handleExpandToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <Card
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
          <GroupIcon
            sx={{
              color: 'primary.main',
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
            Thành viên
          </Typography>
          {uniqueMembers.length > 0 && (
            <Chip
              label={`${activeMembersCount}/${uniqueMembers.length}`}
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Quick Preview - Show first 3 members as avatars */}
          {!expanded && uniqueMembers.length > 0 && (
            <AvatarGroup
              max={3}
              sx={{
                '& .MuiAvatar-root': {
                  width: 24,
                  height: 24,
                  fontSize: '0.7rem',
                  border: '1px solid',
                  borderColor: 'divider',
                }
              }}
            >
              {uniqueMembers.slice(0, 3).map((member) => {
                const isActive = typeof isMemberInBoard === 'function' && member._id
                  ? isMemberInBoard(member._id)
                  : member.isActive !== false;

                return (
                  <Tooltip key={member._id} title={member.fullName || 'Không xác định'}>
                    <Avatar
                      src={member.avatar}
                      sx={{
                        opacity: isActive ? 1 : 0.5,
                        filter: isActive ? 'none' : 'grayscale(100%)',
                      }}
                    >
                      {(member.fullName || 'U').charAt(0).toUpperCase()}
                    </Avatar>
                  </Tooltip>
                );
              })}
            </AvatarGroup>
          )}

          {isBoardOwner && (
            <Tooltip title='Thêm thành viên'>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenAddMemberDialog(true);
                }}
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.main',
                    color: 'white',
                  }
                }}
              >
                <PersonAddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

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
      </Box>

      {/* Expanded Content */}
      <Collapse in={expanded}>
        <Box sx={{ p: 2, pt: 0 }}>
          {uniqueMembers.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {uniqueMembers.map((member) => {
                const isActive = typeof isMemberInBoard === 'function' && member._id
                  ? isMemberInBoard(member._id)
                  : member.isActive !== false;

                return (
                  <Box
                    key={member._id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: 'action.hover',
                      p: 1,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.2s',
                      opacity: isActive ? 1 : 0.6,
                      '&:hover': {
                        bgcolor: 'action.selected',
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <Avatar
                      src={member.avatar}
                      alt={member.fullName}
                      sx={{
                        width: 28,
                        height: 28,
                        fontSize: '0.75rem',
                        filter: isActive ? 'none' : 'grayscale(80%)',
                      }}
                    >
                      {(member.fullName || 'U').charAt(0).toUpperCase()}
                    </Avatar>

                    <Typography
                      variant="body2"
                      sx={{
                        textDecoration: isActive ? 'none' : 'line-through',
                        color: isActive ? 'text.primary' : 'text.secondary',
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 500 : 400,
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      {member.fullName || 'Không xác định'}
                    </Typography>

                    {isBoardOwner && (
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMember(member._id);
                        }}
                        disabled={loading.removeMember}
                        size="small"
                        sx={{
                          width: 24,
                          height: 24,
                          color: 'error.main',
                          opacity: 0.7,
                          '&:hover': {
                            opacity: 1,
                            bgcolor: 'error.main',
                            color: 'white',
                          }
                        }}
                      >
                        {loading.removeMember ? (
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
                        ) : (
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        )}
                      </IconButton>
                    )}
                  </Box>
                );
              })}
            </Box>
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
              Chưa có thành viên nào trong thẻ
            </Typography>
          )}
        </Box>
      </Collapse>
    </Card>
  );
}

export default MembersSection;