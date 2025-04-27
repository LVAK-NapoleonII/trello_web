import { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTheme } from "@mui/material/styles";

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
  const isDarkMode = theme.palette.mode === "dark";

  console.log("MembersSection props:", {
    members,
    boardMembers,
    isBoardOwner,
    isMemberInBoard,
  });

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: isDarkMode
              ? theme.palette.grey[200]
              : theme.palette.text.primary,
          }}
        >
          Thành viên
        </Typography>
        {isBoardOwner && (
          <Tooltip title="Thêm thành viên">
            <IconButton
              onClick={() => setOpenAddMemberDialog(true)}
              sx={{
                color: theme.palette.primary.main,
                "&:hover": {
                  bgcolor: theme.palette.action.hover,
                },
              }}
            >
              <PersonAddIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {members?.length > 0 ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {members.map((member) => {
            // Kiểm tra xem isMemberInBoard có phải là hàm không
            const isActive =
              typeof isMemberInBoard === "function"
                ? isMemberInBoard(member._id)
                : true;
            console.log(
              `Member ${member._id} (${member.fullName}): isMemberInBoard = ${isActive}`
            );
            return (
              <Box
                key={member._id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  bgcolor: isDarkMode
                    ? theme.palette.grey[800]
                    : theme.palette.grey[100],
                  p: 1,
                  borderRadius: 1,
                  transition: "background-color 0.2s",
                  "&:hover": {
                    bgcolor: isDarkMode
                      ? theme.palette.grey[700]
                      : theme.palette.grey[200],
                  },
                }}
              >
                <Avatar
                  src={member.avatar}
                  alt={member.fullName}
                  sx={{
                    width: 24,
                    height: 24,
                    bgcolor: theme.palette.background.paper,
                    border: (theme) =>
                      `1px solid ${
                        isDarkMode
                          ? theme.palette.grey[700]
                          : theme.palette.grey[300]
                      }`,
                  }}
                />
                <Typography
                  sx={{
                    textDecoration: isActive ? "none" : "line-through",
                    color: isActive
                      ? isDarkMode
                        ? theme.palette.grey[200]
                        : theme.palette.text.primary
                      : isDarkMode
                      ? theme.palette.grey[400]
                      : theme.palette.text.secondary,
                  }}
                >
                  {member.fullName}
                </Typography>
                {isBoardOwner && (
                  <Tooltip title="Xóa thành viên">
                    <IconButton
                      onClick={() => handleRemoveMember(member._id)}
                      disabled={loading.removeMember}
                      size="small"
                      sx={{
                        color: theme.palette.error.main,
                        "&:hover": {
                          bgcolor: theme.palette.action.hover,
                        },
                      }}
                    >
                      {loading.removeMember ? (
                        <CircularProgress
                          size={16}
                          sx={{
                            color: isDarkMode
                              ? theme.palette.grey[400]
                              : theme.palette.text.secondary,
                          }}
                        />
                      ) : (
                        <DeleteIcon
                          fontSize="small"
                          sx={{
                            color: theme.palette.error.main,
                          }}
                        />
                      )}
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            );
          })}
        </Box>
      ) : (
        <Typography
          sx={{
            color: isDarkMode
              ? theme.palette.grey[400]
              : theme.palette.text.secondary,
          }}
        >
          Chưa có thành viên nào trong thẻ.
        </Typography>
      )}
    </Box>
  );
}

export default MembersSection;
