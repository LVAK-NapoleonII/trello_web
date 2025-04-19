import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  CircularProgress,
  Chip,
  Stack,
} from "@mui/material";
import axios from "axios";

function MemberSection({ card, setCards, setColumns, onExpandChange }) {
  const [boardMembers, setBoardMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBoardMembers = async () => {
    if (!card?.board) {
      setError("Không tìm thấy ID của bảng!");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/boards/${card.board}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const members = response.data.members || [];
      setBoardMembers(members);
      setError(members.length === 0 ? "Bảng không có thành viên nào." : null);
    } catch (err) {
      console.error(
        "Error fetching board members:",
        err.response?.data || err.message
      );
      setError(
        `Không thể lấy danh sách thành viên: ${
          err.response?.data?.message || err.message
        }`
      );
      setBoardMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardMembers();
  }, [card.board]);

  const handleAddMember = async () => {
    if (!selectedMemberId) {
      setError("Vui lòng chọn một thành viên!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/cards/${card._id}/members`,
        { memberId: selectedMemberId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCards((prevCards) =>
        prevCards.map((c) =>
          c._id === card._id
            ? { ...c, members: response.data.members || [] }
            : c
        )
      );

      setColumns((prevColumns) =>
        prevColumns.map((col) =>
          col._id === card.list
            ? {
                ...col,
                cards: col.cards.map((c) =>
                  c._id === card._id
                    ? { ...c, members: response.data.members || [] }
                    : c
                ),
              }
            : col
        )
      );

      setSelectedMemberId("");
      setError(null);
      onExpandChange(true);
    } catch (err) {
      console.error("Error adding member:", err.response?.data || err.message);
      setError(
        `Có lỗi xảy ra khi thêm thành viên: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  if (!card?.members?.length && !boardMembers.length) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="text.primary" gutterBottom>
        Thành viên
      </Typography>
      {card?.members?.length > 0 ? (
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          {card.members.map((member, index) => (
            <Chip
              key={member._id || index}
              label={member.fullName || member.email || "Không xác định"}
              size="small"
              sx={{
                bgcolor: (theme) => theme.palette.primary.light,
                color: "white",
              }}
            />
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Chưa có thành viên
        </Typography>
      )}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <TextField
          select
          label="Thêm thành viên"
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
          SelectProps={{ native: true }}
          size="small"
          disabled={loading || boardMembers.length === 0}
          sx={{ flex: 1 }}
          variant="outlined"
        >
          <option value="">Chọn thành viên</option>
          {boardMembers.map((member) => (
            <option key={member._id} value={member._id}>
              {member.fullName || member.email || "Không xác định"}
            </option>
          ))}
        </TextField>
        <Button
          variant="contained"
          size="small"
          onClick={handleAddMember}
          disabled={loading || !selectedMemberId}
        >
          {loading ? <CircularProgress size={20} /> : "Thêm"}
        </Button>
      </Box>
      {error && (
        <Typography color="error" variant="caption" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}

export default MemberSection;
