import { useState, useEffect, useContext, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Typography,
  Box,
} from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import { SocketContext } from "../../../../../../../context/SocketContext";
import { useTheme } from "@mui/material/styles";

function AddMemberDialog({
  open,
  onClose,
  card,
  setCards,
  setColumns,
  boardMembers,
}) {
  const { socket, socketReady } = useContext(SocketContext); // Sử dụng socketReady
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Kiểm tra socket sẵn sàng
  useEffect(() => {
    if (!socket) {
      console.warn("Socket không khả dụng trong AddMemberDialog");
      return;
    }

    socket.on("connect", () => {
      console.log("AddMemberDialog: Socket kết nối");
    });

    socket.on("connect_error", (err) => {
      console.error("AddMemberDialog: Lỗi socket:", err.message);
      toast.error("Lỗi kết nối server!");
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
    };
  }, [socket]);

  // Hàm tìm kiếm người dùng
  const handleSearchUsers = useCallback(async () => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    if (!card?.board || !card?._id) {
      toast.error("Thông tin thẻ không hợp lệ!");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token! Vui lòng đăng nhập lại.");
      }

      const response = await axios.get(
        "http://localhost:5000/api/auth/search",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { query: searchQuery, boardId: card.board },
        }
      );

      console.log("AddMemberDialog: Search response:", response.data);
      console.log("AddMemberDialog: boardMembers:", boardMembers);

      // Lọc người dùng dựa trên boardMembers
      const filteredUsers = response.data.users.filter((user) =>
        boardMembers.some((member) => {
          const memberId = member.user?._id || member._id;
          return (
            memberId?.toString() === user._id.toString() &&
            member.isActive === true
          );
        })
      );

      setUsers(filteredUsers);
      if (filteredUsers.length === 0) {
        toast.info("Không tìm thấy người dùng phù hợp trong bảng!");
      }
    } catch (err) {
      console.error(
        "Lỗi tìm kiếm người dùng:",
        err.response?.data || err.message
      );
      toast.error(
        `Có lỗi khi tìm kiếm người dùng: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading(false);
    }
  }, [searchQuery, card, boardMembers]);

  // Hàm thêm thành viên vào thẻ
  const handleAddMember = async (memberId) => {
    if (!card?._id) {
      toast.error("ID thẻ không hợp lệ!");
      return;
    }

    if (card.members?.some((m) => m._id.toString() === memberId.toString())) {
      toast.info("Người dùng đã là thành viên của thẻ!");
      return;
    }

    const isValidMember = boardMembers.some((member) => {
      const memberIdFromBoard = member.user?._id || member._id;
      return (
        memberIdFromBoard?.toString() === memberId.toString() &&
        member.isActive === true
      );
    });
    if (!isValidMember) {
      toast.error("Người dùng không phải thành viên active của bảng!");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token! Vui lòng đăng nhập lại.");
      }

      const response = await axios.post(
        `http://localhost:5000/api/cards/${card._id}/members`,
        { memberId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCards((prevCards) =>
        prevCards.map((c) =>
          c._id === card._id ? { ...c, members: response.data.members } : c
        )
      );

      setColumns((prevColumns) =>
        prevColumns.map((col) => ({
          ...col,
          cards: col.cards.map((c) =>
            c._id === card._id ? { ...c, members: response.data.members } : c
          ),
        }))
      );

      if (socket && socketReady) {
        socket.emit("member-added", {
          boardId: card.board,
          listId: card.list,
          cardId: card._id,
          members: response.data.members,
        });
        console.log("Emitted member-added:", {
          boardId: card.board,
          listId: card.list,
          cardId: card._id,
          members: response.data.members,
        });
      } else {
        console.warn("Socket chưa sẵn sàng, bỏ qua emit");
      }

      toast.success("Thêm thành viên thành công!");
    } catch (err) {
      console.error("Lỗi thêm thành viên:", err.response?.data || err.message);
      toast.error(
        `Có lỗi khi thêm thành viên: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // Debounce tìm kiếm
  useEffect(() => {
    const debounce = setTimeout(() => {
      handleSearchUsers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, handleSearchUsers]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "12px",
          boxShadow: isDarkMode
            ? "0 4px 16px rgba(0,0,0,0.5)"
            : theme.shadows[5],
          bgcolor: isDarkMode ? "#2a2a3d" : theme.palette.background.paper,
          color: isDarkMode
            ? theme.palette.grey[200]
            : theme.palette.text.primary,
          p: 2,
          minWidth: { xs: "90%", sm: "400px" },
          maxWidth: "500px",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 600,
          fontSize: "1.25rem",
          color: isDarkMode
            ? theme.palette.grey[100]
            : theme.palette.text.primary,
        }}
      >
        Thêm thành viên vào thẻ
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Tìm kiếm người dùng (tên hoặc email)"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={loading}
          sx={{
            mt: 1,
            "& .MuiInputBase-root": {
              borderRadius: "8px",
              bgcolor: isDarkMode
                ? "rgba(255, 255, 255, 0.05)"
                : theme.palette.background.default,
              color: isDarkMode
                ? theme.palette.grey[200]
                : theme.palette.text.primary,
              transition: "all 0.2s ease",
            },
            "& .MuiInputLabel-root": {
              fontWeight: 500,
              color: isDarkMode
                ? theme.palette.grey[400]
                : theme.palette.text.secondary,
              "&.Mui-focused": {
                color: theme.palette.primary.main,
              },
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: isDarkMode
                ? theme.palette.grey[600]
                : theme.palette.grey[300],
              transition: "border-color 0.2s ease",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: isDarkMode
                ? theme.palette.grey[500]
                : theme.palette.primary.main,
            },
            "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: theme.palette.primary.main,
              borderWidth: "2px",
            },
          }}
        />
        <Box sx={{ mt: 2, maxHeight: "300px", overflowY: "auto" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : users.length > 0 ? (
            <List>
              {users.map((user) => (
                <ListItem
                  key={user._id}
                  button
                  onClick={() => handleAddMember(user._id)}
                  disabled={
                    loading ||
                    card.members?.some((m) => m._id === user._id) ||
                    !boardMembers.some((member) => {
                      const memberId = member.user?._id || member._id;
                      return (
                        memberId?.toString() === user._id.toString() &&
                        member.isActive === true
                      );
                    })
                  }
                  sx={{
                    borderRadius: "8px",
                    mb: 0.5,
                    "&:hover": {
                      bgcolor: isDarkMode
                        ? theme.palette.grey[700]
                        : theme.palette.grey[100],
                    },
                    "&.Mui-disabled": {
                      opacity: 0.6,
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={user.avatar} alt={user.fullName} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.fullName}
                    secondary={
                      <>
                        {user.email}
                        {card.members?.some((m) => m._id === user._id) && (
                          <Typography
                            component="span"
                            color="text.secondary"
                            sx={{ ml: 1, fontStyle: "italic" }}
                          >
                            (Đã thêm)
                          </Typography>
                        )}
                        {!boardMembers.some((member) => {
                          const memberId = member.user?._id || member._id;
                          return (
                            memberId?.toString() === user._id.toString() &&
                            member.isActive === true
                          );
                        }) && (
                          <Typography
                            component="span"
                            color="error.main"
                            sx={{ ml: 1, fontStyle: "italic" }}
                          >
                            (Không phải thành viên bảng)
                          </Typography>
                        )}
                      </>
                    }
                    primaryTypographyProps={{
                      fontWeight: 500,
                      color: isDarkMode
                        ? theme.palette.grey[200]
                        : theme.palette.text.primary,
                    }}
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
                p: 2,
                textAlign: "center",
                color: isDarkMode
                  ? theme.palette.grey[400]
                  : theme.palette.text.secondary,
              }}
            >
              {searchQuery.trim()
                ? "Không tìm thấy người dùng phù hợp."
                : "Nhập tên hoặc email để tìm kiếm."}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            color: isDarkMode
              ? theme.palette.grey[400]
              : theme.palette.text.secondary,
            fontWeight: 500,
            borderRadius: "8px",
            px: 2,
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: isDarkMode
                ? theme.palette.grey[700]
                : theme.palette.grey[100],
              transform: "scale(1.05)",
            },
            "&:disabled": {
              color: theme.palette.grey[600],
            },
          }}
        >
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddMemberDialog;
