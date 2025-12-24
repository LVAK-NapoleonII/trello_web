import { useState, useEffect, useContext, useCallback, useRef } from "react";
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
  const [isSearching, setIsSearching] = useState(false);

  // Ref để maintain focus
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

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

  const handleSearchUsers = useCallback(async (query, isInitialLoad = false) => {
    try {
      if (!isInitialLoad) {
        setIsSearching(true);
      } else {
        setLoading(true);
      }

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token! Vui lòng đăng nhập lại.");
      }
      if (!card.board || typeof card.board !== "string") {
        throw new Error("ID bảng không hợp lệ!");
      }

      const params = { boardId: card.board };
      if (query && query.trim()) {
        params.query = query.trim();
      } else {
        params.onlyActiveMembers = true;
      }

      const response = await axios.get("http://localhost:5000/api/auth/search", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      console.log("AddMemberDialog: Search response:", response.data);
      setUsers(response.data.users);

      if (response.data.users.length === 0 && isInitialLoad) {
        toast.info(
          query && query.trim()
            ? "Không tìm thấy người dùng phù hợp!"
            : "Không có thành viên active trong bảng!"
        );
      }
    } catch (err) {
      console.error("Lỗi tìm kiếm người dùng:", err.response?.data || err.message);
      const errorMessage =
        err.response?.status === 404
          ? "Bảng không tồn tại!"
          : err.response?.status === 401
            ? "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!"
            : err.response?.status === 403
              ? "Bạn không có quyền truy cập bảng này! Vui lòng liên hệ quản trị viên."
              : err.response?.data?.message || "Có lỗi khi tìm kiếm người dùng!";
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      if (err.response?.status === 403) {
        onClose();
      }
      toast.error(errorMessage);
      setUsers([]);
    } finally {
      if (!isInitialLoad) {
        setIsSearching(false);
      } else {
        setLoading(false);
      }
    }
  }, [card, onClose]);

  const handleAddMember = async (memberId) => {
    if (!card?._id || typeof card._id !== "string" || !/^[0-9a-fA-F]{24}$/.test(card._id)) {
      console.error("handleAddMember: Invalid card ID", { cardId: card._id });
      toast.error("ID thẻ không hợp lệ!");
      return;
    }
    if (!memberId || typeof memberId !== "string" || !/^[0-9a-fA-F]{24}$/.test(memberId)) {
      console.error("handleAddMember: Invalid member ID", { memberId });
      toast.error("ID thành viên không hợp lệ!");
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
      console.error("handleAddMember: Member not active in board", { memberId });
      toast.error("Người dùng không phải thành viên active của bảng!");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("handleAddMember: Missing token");
        throw new Error("Không tìm thấy token! Vui lòng đăng nhập lại.");
      }

      console.log("handleAddMember: Sending request", { cardId: card._id, memberId });
      const response = await axios.post(
        `http://localhost:5000/api/cards/${card._id}/members`,
        { memberId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("handleAddMember: Success", response.data);
      toast.success("Thêm thành viên thành công!");
      setUsers((prev) => prev.filter((u) => u._id !== memberId));
      onClose();
    } catch (err) {
      console.error("Lỗi thêm thành viên:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      const errorMessage =
        err.response?.status === 400 && err.response?.data?.message === "Thiếu ID mục tiêu!"
          ? "Thiếu thông tin thẻ. Vui lòng thử lại!"
          : err.response?.status === 401
            ? "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!"
            : err.response?.status === 403
              ? "Bạn không có quyền thêm thành viên vào thẻ này!"
              : err.response?.data?.message || "Có lỗi khi thêm thành viên!";
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data when dialog opens
  useEffect(() => {
    if (open && card?.board) {
      handleSearchUsers("", true);
    }
  }, [open, card?.board, handleSearchUsers]);

  // Debounced search with focus preservation
  const debouncedSearchUsers = useCallback(
    debounce((query) => {
      handleSearchUsers(query, false);
    }, 300),
    [handleSearchUsers]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout to preserve focus
    searchTimeoutRef.current = setTimeout(() => {
      debouncedSearchUsers(value);
    }, 300);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      debouncedSearchUsers.cancel();
    };
  }, [debouncedSearchUsers]);

  // Reset search when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setUsers([]);
      setIsSearching(false);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    }
  }, [open]);

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
          inputRef={searchInputRef}
          autoFocus
          margin="dense"
          label="Tìm kiếm người dùng (tên hoặc email)"
          fullWidth
          value={searchQuery}
          onChange={handleSearchChange}
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
          {(loading || isSearching) ? (
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
                    isSearching ||
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
                : "Không có thành viên hoạt động trong bảng."}
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