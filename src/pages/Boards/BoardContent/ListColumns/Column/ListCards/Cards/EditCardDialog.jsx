import { useState, useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  InputAdornment,
  Box,
} from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import { SocketContext } from "../../../../../../../context/SocketContext";

function EditCardDialog({ open, onClose, card, setCards, setColumns }) {
  const { socket } = useContext(SocketContext);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [dueDate, setDueDate] = useState(
    card.dueDate ? new Date(card.dueDate).toISOString().slice(0, 16) : ""
  );
  const [cover, setCover] = useState(card.cover || "");
  const [loading, setLoading] = useState(false);

  const handleUpdateCard = async () => {
    if (!title.trim()) {
      toast.error("Tiêu đề không được để trống!");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/cards/${card._id}`,
        {
          title,
          description,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          cover,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCards((prevCards) =>
        prevCards.map((c) =>
          c._id === card._id ? { ...c, ...response.data } : c
        )
      );

      setColumns((prevColumns) =>
        prevColumns.map((col) => ({
          ...col,
          cards: col.cards.map((c) =>
            c._id === card._id ? { ...c, ...response.data } : c
          ),
        }))
      );

      if (socket) {
        socket.emit("card-updated", { cardId: card._id, card: response.data });
      }

      toast.success("Cập nhật thẻ thành công!");
      onClose();
    } catch (err) {
      console.error("Error updating card:", err);
      toast.error(
        `Có lỗi khi cập nhật thẻ: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Chỉnh sửa thẻ</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Tiêu đề"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          variant="outlined"
        />
        <TextField
          margin="dense"
          label="Mô tả"
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          variant="outlined"
        />
        <TextField
          margin="dense"
          label="Hạn chót"
          type="datetime-local"
          fullWidth
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={loading}
          variant="outlined"
        />
        <TextField
          margin="dense"
          label="Màu bìa (HEX)"
          fullWidth
          value={cover}
          onChange={(e) => setCover(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    bgcolor: cover,
                    border: "1px solid #ccc",
                    borderRadius: 1,
                  }}
                />
              </InputAdornment>
            ),
          }}
          disabled={loading}
          variant="outlined"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          onClick={handleUpdateCard}
          variant="contained"
          disabled={loading || !title.trim()}
        >
          {loading ? "Đang cập nhật..." : "Cập nhật"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditCardDialog;
