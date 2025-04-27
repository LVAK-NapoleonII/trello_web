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
import debounce from "lodash/debounce";

function AddMemberDialog({
  open,
  onClose,
  card,
  setCards,
  setColumns,
  boardMembers,
  setBoardMembers,
}) {
  const { socket, socketReady } = useContext(SocketContext);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Kiểm tra dữ liệu đầu vào
  if (!card || !card._id || !card.board) {
    toast.error("Dữ liệu thẻ không hợp lệ!");
    return null;
  }

  // Chuẩn hóa boardMembers
  const normalizedBoardMembers = Array.isArray(boardMembers)
    ? boardMembers.map((member) => ({
        ...member,
        id: (member.user?._id || member._id)?.toString(),
        isActive: member.isActive === true,
      }))
    : [];

  useEffect(() => {
    if (!socket || !socketReady) {
      console.warn("AddMemberDialog: Socket không khả dụng hoặc chưa sẵn sàng");
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
  }, [socket, socketReady]);

  useEffect(() => {
    if (!socket || !socketReady || !card?.board) return;

    const handleMemberAddedToBoard = ({ boardId, member }) => {
      if (boardId === card.board) {
        console.log("AddMemberDialog: Received member-added-to-board:", {
          boardId,
          member,
        });
        setBoardMembers((prev) => {
          const exists = prev.some(
            (m) => (m.user?._id || m._id)?.toString() === member._id.toString()
          );
          if (!exists) {
            return [...prev, { ...member, isActive: true }];
          }
          return prev;
        });
        toast.info(`Thành viên ${member.fullName} đã được thêm vào bảng.`);
      }
    };

    const handleMemberDeactivated = ({ boardId, memberId }) => {
      if (boardId === card.board) {
        console.log("AddMemberDialog: Received member-deactivated:", {
          boardId,
          memberId,
        });
        // Cập nhật boardMembers
        setBoardMembers((prev) =>
          prev.map((m) =>
            (m.user?._id || m._id)?.toString() === memberId.toString()
              ? { ...m, isActive: false }
              : m
          )
        );
        // Cập nhật cards và columns
        setCards((prevCards) =>
          prevCards.map((c) =>
            c.board === boardId &&
            c.members?.some((m) => m._id.toString() === memberId.toString())
              ? {
                  ...c,
                  members: c.members.map((m) =>
                    m._id.toString() === memberId.toString()
                      ? { ...m, isActive: false }
                      : m
                  ),
                }
              : c
          )
        );
        setColumns((prevColumns) =>
          prevColumns.map((col) => ({
            ...col,
            cards: col.cards.map((c) =>
              c.board === boardId &&
              c.members?.some((m) => m._id.toString() === memberId.toString())
                ? {
                    ...c,
                    members: c.members.map((m) =>
                      m._id.toString() === memberId.toString()
                        ? { ...m, isActive: false }
                        : m
                    ),
                  }
                : c
            ),
          }))
        );
        toast.info("Một thành viên đã bị vô hiệu hóa trong bảng.");
      }
    };

    const handleMemberAdded = ({ cardId, member, clientId }) => {
      if (clientId === socket.id) {
        console.log("AddMemberDialog: Bỏ qua member-added từ chính client");
        return;
      }
      if (cardId === card._id) {
        console.log("AddMemberDialog: Received member-added:", {
          cardId,
          member,
        });
        setCards((prevCards) =>
          prevCards.map((c) =>
            c._id === cardId
              ? {
                  ...c,
                  members: [
                    ...(c.members || []).filter(
                      (m) => m._id.toString() !== member._id.toString()
                    ),
                    { ...member, isActive: true },
                  ],
                }
              : c
          )
        );
        setColumns((prevColumns) =>
          prevColumns.map((col) => ({
            ...col,
            cards: col.cards.map((c) =>
              c._id === cardId
                ? {
                    ...c,
                    members: [
                      ...(c.members || []).filter(
                        (m) => m._id.toString() !== member._id.toString()
                      ),
                      { ...member, isActive: true },
                    ],
                  }
                : c
            ),
          }))
        );
        toast.info(`Thành viên ${member.fullName} đã được thêm vào thẻ.`);
      }
    };

    socket.on("member-added-to-board", handleMemberAddedToBoard);
    socket.on("member-deactivated", handleMemberDeactivated);
    socket.on("member-added", handleMemberAdded);

    return () => {
      socket.off("member-added-to-board", handleMemberAddedToBoard);
      socket.off("member-deactivated", handleMemberDeactivated);
      socket.off("member-added", handleMemberAdded);
    };
  }, [
    socket,
    socketReady,
    card?.board,
    card?._id,
    setBoardMembers,
    setCards,
    setColumns,
  ]);

  const handleSearchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token! Vui lòng đăng nhập lại.");
      }

      const params = { boardId: card.board };
      if (searchQuery.trim()) {
        params.query = searchQuery;
      } else {
        params.onlyActiveMembers = true;
      }

      const response = await axios.get(
        "http://localhost:5000/api/auth/search",
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );

      console.log("AddMemberDialog: Search response:", response.data);
      setUsers(response.data.users);
      if (response.data.users.length === 0) {
        toast.info(
          searchQuery.trim()
            ? "Không tìm thấy người dùng phù hợp!"
            : "Không có thành viên active trong bảng!"
        );
      }
    } catch (err) {
      console.error(
        "Lỗi tìm kiếm người dùng:",
        err.response?.data || err.message
      );
      const errorMessage =
        err.response?.status === 404
          ? "Bảng không tồn tại!"
          : err.response?.status === 401
          ? "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!"
          : err.response?.data?.message || "Có lỗi khi tìm kiếm người dùng!";
      toast.error(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, card]);

  const handleAddMember = async (memberId) => {
    if (!card?._id) {
      toast.error("ID thẻ không hợp lệ!");
      return;
    }

    if (card.members?.some((m) => m._id.toString() === memberId.toString())) {
      toast.info("Người dùng đã là thành viên của thẻ!");
      return;
    }

    const isValidMember = normalizedBoardMembers.some(
      (member) => member.id === memberId.toString() && member.isActive
    );
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

      const selectedUser = users.find(
        (u) => u._id.toString() === memberId.toString()
      );
      const newMember = {
        _id: memberId,
        fullName:
          selectedUser?.fullName ||
          response.data.members.find(
            (m) => m._id.toString() === memberId.toString()
          )?.fullName ||
          "Unknown",
        email: selectedUser?.email || "",
        avatar: selectedUser?.avatar || "",
        isActive: true,
      };

      setCards((prevCards) =>
        prevCards.map((c) =>
          c._id === card._id
            ? {
                ...c,
                members: response.data.members
                  .filter(
                    (m, index, self) =>
                      self.findIndex(
                        (x) => x._id.toString() === m._id.toString()
                      ) === index
                  )
                  .map((m) => ({
                    _id: m._id,
                    fullName: m.fullName,
                    email: m.email,
                    avatar: m.avatar || "",
                    isActive: m.isActive !== false,
                  })),
              }
            : c
        )
      );

      setColumns((prevColumns) =>
        prevColumns.map((col) => ({
          ...col,
          cards: col.cards.map((c) =>
            c._id === card._id
              ? {
                  ...c,
                  members: response.data.members
                    .filter(
                      (m, index, self) =>
                        self.findIndex(
                          (x) => x._id.toString() === m._id.toString()
                        ) === index
                    )
                    .map((m) => ({
                      _id: m._id,
                      fullName: m.fullName,
                      email: m.email,
                      avatar: m.avatar || "",
                      isActive: m.isActive !== false,
                    })),
                }
              : c
          ),
        }))
      );

      if (socket && socketReady) {
        socket.emit("member-added", {
          cardId: card._id,
          member: newMember,
          clientId: socket.id,
        });
        console.log("Emitted member-added:", {
          cardId: card._id,
          member: newMember,
          clientId: socket.id,
        });
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

  useEffect(() => {
    if (open && card?.board) {
      handleSearchUsers();
    }
  }, [open, card?.board, handleSearchUsers]);

  const debouncedSearchUsers = useCallback(
    debounce(() => {
      handleSearchUsers();
    }, 300),
    [handleSearchUsers]
  );

  useEffect(() => {
    debouncedSearchUsers();
    return () => {
      debouncedSearchUsers.cancel();
    };
  }, [searchQuery, debouncedSearchUsers]);

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
        {normalizedBoardMembers.length === 0 && (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography
              sx={{
                color: isDarkMode
                  ? theme.palette.grey[400]
                  : theme.palette.text.secondary,
              }}
            >
              Không có thành viên trong bảng để thêm.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => {
                toast.info("Chuyển hướng đến giao diện mời thành viên...");
              }}
              sx={{ mt: 1 }}
            >
              Mời thành viên vào bảng
            </Button>
          </Box>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="Tìm kiếm người dùng (tên hoặc email)"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={loading || normalizedBoardMembers.length === 0}
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
                    card.members?.some(
                      (m) => m._id.toString() === user._id.toString()
                    ) ||
                    !normalizedBoardMembers.some(
                      (member) =>
                        member.id === user._id.toString() && member.isActive
                    )
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
                        {card.members?.some(
                          (m) => m._id.toString() === user._id.toString()
                        ) && (
                          <Typography
                            component="span"
                            color="text.secondary"
                            sx={{ ml: 1, fontStyle: "italic" }}
                          >
                            (Đã thêm)
                          </Typography>
                        )}
                        {!normalizedBoardMembers.some(
                          (member) =>
                            member.id === user._id.toString() && member.isActive
                        ) && (
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
                : "Không có thành viên active trong bảng."}
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
