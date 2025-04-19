import {
  Box,
  Typography,
  Chip,
  Stack,
  Button,
  CircularProgress,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";

const MembersSection = ({
  members,
  boardMembers,
  isBoardOwner,
  loading,
  handleRemoveMember,
  setOpenAddMemberDialog,
  isMemberInBoard,
}) => (
  <Box sx={{ mb: 3 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
      <PersonIcon fontSize="small" color="action" />
      <Typography variant="h6" color="text.primary">
        Thành viên
      </Typography>
    </Box>
    {members?.length > 0 ? (
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
        {members.map((member, index) => (
          <Chip
            key={member._id || index}
            label={member.fullName || member.email || "Không xác định"}
            size="small"
            sx={{
              bgcolor: "info.main",
              color: "info.contrastText",
              textDecoration: !isMemberInBoard(member._id)
                ? "line-through"
                : "none",
              "& .MuiChip-deleteIcon": {
                color: "info.contrastText",
              },
            }}
            onDelete={
              isBoardOwner && !loading.removeMember
                ? () => handleRemoveMember(member._id)
                : undefined
            }
            deleteIcon={
              isBoardOwner && loading.removeMember ? (
                <CircularProgress size={14} sx={{ color: "inherit" }} />
              ) : undefined
            }
          />
        ))}
      </Stack>
    ) : (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Chưa có thành viên
      </Typography>
    )}
    <Button
      size="small"
      onClick={() => setOpenAddMemberDialog(true)}
      variant="outlined"
      sx={{
        borderColor: "primary.main",
        color: "primary.main",
        "&:hover": {
          bgcolor: "primary.light",
          borderColor: "primary.dark",
        },
      }}
    >
      Thêm thành viên
    </Button>
  </Box>
);

export default MembersSection;
