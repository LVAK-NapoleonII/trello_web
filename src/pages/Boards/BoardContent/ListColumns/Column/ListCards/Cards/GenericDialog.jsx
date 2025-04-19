import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";

function GenericDialog({ open, onClose, card, setCards, setColumns, type }) {
  const [checklistTitle, setChecklistTitle] = useState("");
  const [error, setError] = useState(null);

  const handleAddChecklist = async () => {
    if (!checklistTitle.trim()) {
      setError("Tiêu đề checklist không được để trống!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/cards/${card._id}/checklists`,
        { title: checklistTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCards((prevCards) =>
        prevCards.map((c) =>
          c._id === card._id ? { ...c, checklists: response.data } : c
        )
      );
      setColumns((prevColumns) =>
        prevColumns.map((col) =>
          col._id === card.list
            ? {
                ...col,
                cards: col.cards.map((c) =>
                  c._id === card._id ? { ...c, checklists: response.data } : c
                ),
              }
            : col
        )
      );
      onClose();
      setChecklistTitle("");
      setError(null);
      toast.success("Thêm checklist thành công!");
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
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Thêm checklist</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Tiêu đề checklist"
          fullWidth
          value={checklistTitle}
          onChange={(e) => setChecklistTitle(e.target.value)}
          error={!!error}
          variant="outlined"
        />
        {error && (
          <Typography color="error" variant="caption" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button
          onClick={handleAddChecklist}
          variant="contained"
          disabled={!checklistTitle.trim()}
        >
          Thêm
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default GenericDialog;
