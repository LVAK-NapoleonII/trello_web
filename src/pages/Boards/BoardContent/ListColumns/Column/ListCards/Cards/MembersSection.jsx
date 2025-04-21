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

function MembersSection({
  members,
  boardMembers,
  isBoardOwner,
  loading,
  handleRemoveMember,
  setOpenAddMemberDialog,
  isMemberInBoard,
}) {
  console.log("MembersSection props:", { members, boardMembers, isBoardOwner });

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
            color: (theme) => theme.palette.text.primary,
          }}
        >
          Thành viên
        </Typography>
        {isBoardOwner && (
          <Tooltip title="Thêm thành viên">
            <IconButton
              onClick={() => setOpenAddMemberDialog(true)}
              sx={{
                color: (theme) => theme.palette.primary.main,
                "&:hover": {
                  bgcolor: (theme) => theme.palette.action.hover,
                },
              }}
            >
              <PersonAddIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {members.map((member) => {
          const isActive = isMemberInBoard(member._id);
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
                bgcolor: (theme) =>
                  theme.palette.mode === "light"
                    ? theme.palette.grey[100]
                    : theme.palette.grey[800],
                p: 1,
                borderRadius: 1,
                transition: "background-color 0.2s",
                "&:hover": {
                  bgcolor: (theme) =>
                    theme.palette.mode === "light"
                      ? theme.palette.grey[200]
                      : theme.palette.grey[700],
                },
              }}
            >
              <Avatar
                src={member.avatar}
                alt={member.fullName}
                sx={{
                  width: 24,
                  height: 24,
                  bgcolor: (theme) => theme.palette.background.paper,
                  border: (theme) =>
                    `1px solid ${
                      theme.palette.mode === "light"
                        ? theme.palette.grey[300]
                        : theme.palette.grey[700]
                    }`,
                }}
              />
              <Typography
                sx={{
                  textDecoration: isActive ? "none" : "line-through",
                  color: isActive
                    ? (theme) => theme.palette.text.primary
                    : (theme) => theme.palette.text.secondary,
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
                      color: (theme) => theme.palette.error.main,
                      "&:hover": {
                        bgcolor: (theme) => theme.palette.action.hover,
                      },
                    }}
                  >
                    {loading.removeMember ? (
                      <CircularProgress
                        size={16}
                        sx={{
                          color: (theme) => theme.palette.text.secondary,
                        }}
                      />
                    ) : (
                      <DeleteIcon
                        fontSize="small"
                        sx={{
                          color: (theme) => theme.palette.error.main,
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
    </Box>
  );
}

export default MembersSection;
