import { useState, useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import { SocketContext } from "../../../../../../../context/SocketContext";
import { useTheme } from "@mui/material/styles";

function GenericDialog({ open, onClose, card, setCards, setColumns }) {
  const { socket, socketReady } = useContext(SocketContext);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [checklistTitle, setChecklistTitle] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Lấy currentUserId
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Không tìm thấy token!");
        const response = await axios.get(
          "http://localhost:5000/api/auth/profile",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const userId = response.data.user._id || response.data.user.id;
        setCurrentUserId(userId);
      } catch (err) {
        console.error("Lỗi lấy thông tin người dùng:", err);
        toast.error("Không thể lấy thông tin người dùng hiện tại.");
      }
    };
    fetchCurrentUser();
  }, []);

  const normalizeChecklists = (checklists) => {
    if (!Array.isArray(checklists)) {
      console.warn("Checklists không phải là mảng:", checklists);
      return [];
    }
    return checklists.map((checklist) => ({
      _id: checklist._id || new Date().toISOString(),
      title: checklist.title || "Untitled Checklist",
      items: Array.isArray(checklist.items)
        ? checklist.items.map((item) => ({
          _id: item._id || new Date().toISOString(),
          text: item.text || "",
          completed: !!item.completed,
          createdAt: item.createdAt || new Date().toISOString(),
        }))
        : [],
    }));
  };

  const updateCardState = (cardId, updatedFields) => {
    setCards((prevCards) => {
      const newCards = prevCards.map((c) =>
        c._id === cardId ? { ...c, ...updatedFields } : c
      );
      console.log("Updated cards in GenericDialog:", newCards);
      return newCards;
    });
    setColumns((prevColumns) => {
      const newColumns = prevColumns.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c._id === cardId ? { ...c, ...updatedFields } : c
        ),
      }));
      console.log("Updated columns in GenericDialog:", newColumns);
      return newColumns;
    });
  };

  const handleAddChecklist = async () => {
    if (!checklistTitle.trim()) {
      setError("Tiêu đề checklist không được để trống!");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token! Vui lòng đăng nhập lại.");
      }

      // Thêm checklist tạm thời vào UI
      const tempChecklist = {
        _id: new Date().toISOString(),
        title: checklistTitle,
        items: [],
      };
      updateCardState(card._id, {
        checklists: [
          ...normalizeChecklists(card.checklists || []),
          tempChecklist,
        ],
      });

      const response = await axios.post(
        `http://localhost:5000/api/cards/${card._id}/checklists`,
        { title: checklistTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const validatedChecklists = normalizeChecklists(response.data);
      const newChecklist = validatedChecklists[
        validatedChecklists.length - 1
      ] || {
        _id: new Date().toISOString(),
        title: checklistTitle,
        items: [],
      };

      // Cập nhật trạng thái với dữ liệu từ server
      updateCardState(card._id, {
        checklists: validatedChecklists,
      });

      // Phát sự kiện socket
      if (socket && socketReady) {
        socket.emit("checklist-added", {
          cardId: card._id,
          checklist: newChecklist,
          actorId: currentUserId,
        });
        console.log("Emitted checklist-added from GenericDialog:", {
          cardId: card._id,
          checklist: newChecklist,
          actorId: currentUserId,
        });
      }

      setChecklistTitle("");
      setError(null);
      toast.success("Thêm checklist thành công!");
      onClose();
    } catch (err) {
      console.error("Lỗi thêm checklist:", err);
      // Khôi phục trạng thái nếu có lỗi
      updateCardState(card._id, { checklists: card.checklists });
      setError(
        err.response?.data?.message ||
        err.message ||
        "Có lỗi khi thêm checklist."
      );
      toast.error(
        `Có lỗi khi thêm checklist: ${err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        setChecklistTitle("");
        setError(null);
        onClose();
      }}
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "12px",
          bgcolor: isDarkMode ? "#2a2a3d" : theme.palette.background.paper,
          color: isDarkMode
            ? theme.palette.grey[200]
            : theme.palette.text.primary,
        },
      }}
    >
      <DialogTitle
        sx={{
          color: isDarkMode
            ? theme.palette.grey[100]
            : theme.palette.text.primary,
        }}
      >
        Thêm danh sách công việc
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Tiêu đề Danh sách"
          type="text"
          fullWidth
          variant="outlined"
          value={checklistTitle}
          onChange={(e) => {
            setChecklistTitle(e.target.value);
            setError(null);
          }}
          error={!!error}
          helperText={error}
          disabled={loading}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: isDarkMode
                ? "rgba(255, 255, 255, 0.05)"
                : theme.palette.background.default,
              borderRadius: 2,
              "& fieldset": {
                borderColor: isDarkMode
                  ? theme.palette.grey[600]
                  : theme.palette.divider,
              },
              "&:hover fieldset": {
                borderColor: isDarkMode
                  ? theme.palette.grey[500]
                  : theme.palette.text.secondary,
              },
              "&.Mui-focused fieldset": {
                borderColor: theme.palette.primary.main,
              },
            },
            "& .MuiInputLabel-root": {
              color: isDarkMode
                ? theme.palette.grey[400]
                : theme.palette.text.secondary,
            },
            "& .MuiInputBase-input": {
              color: isDarkMode
                ? theme.palette.grey[200]
                : theme.palette.text.primary,
            },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setChecklistTitle("");
            setError(null);
            onClose();
          }}
          sx={{
            color: isDarkMode
              ? theme.palette.grey[400]
              : theme.palette.text.secondary,
          }}
          disabled={loading}
        >
          Hủy
        </Button>
        <Button
          onClick={handleAddChecklist}
          variant="contained"
          disabled={loading || !checklistTitle.trim()}
          sx={{
            bgcolor: theme.palette.primary.main,
            "&:hover": {
              bgcolor: theme.palette.primary.dark,
            },
          }}
        >
          {loading ? <CircularProgress size={20} /> : "Thêm"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default GenericDialog;
