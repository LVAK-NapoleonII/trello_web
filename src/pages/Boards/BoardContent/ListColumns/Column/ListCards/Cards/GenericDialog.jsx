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

      const response = await axios.post(
        `http://localhost:5000/api/cards/${card._id}/checklists`,
        { title: checklistTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Kiểm tra và chuẩn hóa dữ liệu checklists
      const validatedChecklists = (response.data || []).map((checklist) => ({
        ...checklist,
        items: Array.isArray(checklist.items) ? checklist.items : [],
      }));

      const newChecklist = validatedChecklists[
        validatedChecklists.length - 1
      ] || {
        title: checklistTitle,
        items: [],
      };

      setCards((prevCards) =>
        prevCards.map((c) =>
          c._id === card._id ? { ...c, checklists: validatedChecklists } : c
        )
      );

      setColumns((prevColumns) =>
        prevColumns.map((col) => ({
          ...col,
          cards: col.cards.map((c) =>
            c._id === card._id ? { ...c, checklists: validatedChecklists } : c
          ),
        }))
      );

      if (socket && socketReady) {
        socket.emit("checklist-added", {
          cardId: card._id,
          checklist: newChecklist,
        });
        console.log("Emitted checklist-added:", {
          cardId: card._id,
          checklist: newChecklist,
        });
      } else {
        console.warn("Socket chưa sẵn sàng, bỏ qua emit");
      }

      toast.success("Thêm checklist thành công!");
      setChecklistTitle("");
      setError(null);
      onClose();
    } catch (err) {
      console.error(
        "Error adding checklist:",
        err.response?.data || err.message
      );
      setError(
        `Có lỗi xảy ra khi thêm checklist: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "12px",
          bgcolor: isDarkMode ? "#2a2a3d" : theme.palette.background.paper,
          color: isDarkMode
            ? theme.palette.grey[200]
            : theme.palette.text.primary,
          boxShadow: isDarkMode
            ? "0 4px 16px rgba(0,0,0,0.5)"
            : theme.shadows[5],
        },
      }}
    >
      <DialogTitle
        sx={{
          color: isDarkMode
            ? theme.palette.grey[100]
            : theme.palette.text.primary,
          fontWeight: 600,
        }}
      >
        Thêm checklist
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Tiêu đề checklist"
          fullWidth
          value={checklistTitle}
          onChange={(e) => {
            setChecklistTitle(e.target.value);
            setError(null);
          }}
          error={!!error}
          disabled={loading}
          variant="outlined"
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
              "&.Mui-focused": {
                color: theme.palette.primary.main,
              },
            },
            "& .MuiInputBase-input": {
              color: isDarkMode
                ? theme.palette.grey[200]
                : theme.palette.text.primary,
            },
          }}
        />
        {error && (
          <Typography
            color="error"
            variant="caption"
            sx={{ mt: 1, display: "block" }}
          >
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            color: isDarkMode
              ? theme.palette.grey[400]
              : theme.palette.text.secondary,
            "&:hover": {
              bgcolor: isDarkMode
                ? theme.palette.grey[700]
                : theme.palette.grey[100],
            },
          }}
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
            "&:disabled": {
              bgcolor: theme.palette.grey[400],
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
