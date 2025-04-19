import { useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios";
import GenericDialog from "./GenericDialog";

function ChecklistSection({ card, setCards, setColumns, onExpandChange }) {
  const [checklistItemText, setChecklistItemText] = useState("");
  const [selectedChecklistIndex, setSelectedChecklistIndex] = useState(null);
  const [openChecklistDialog, setOpenChecklistDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddChecklistItem = async (checklistIndex) => {
    if (!checklistItemText.trim()) {
      setError("Nội dung item không được để trống!");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/cards/${card._id}/checklists/${checklistIndex}/items`,
        { text: checklistItemText },
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
      setChecklistItemText("");
      setError(null);
      onExpandChange(true); // Ensure card stays expanded
    } catch (err) {
      console.error(
        "Error adding checklist item:",
        err.response?.data || err.message
      );
      setError(
        `Có lỗi xảy ra khi thêm item vào checklist: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChecklistItem = async (checklistIndex, itemIndex) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/cards/${card._id}/checklists/${checklistIndex}/items/${itemIndex}/toggle`,
        {},
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
    } catch (err) {
      console.error(
        "Error toggling checklist item:",
        err.response?.data || err.message
      );
      alert(
        `Có lỗi khi cập nhật trạng thái item: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  if (!card?.checklists?.length) return null;

  return (
    <>
      <Box sx={{ mt: 2 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          Checklist:
        </Typography>
        {card.checklists.map((checklist, index) => (
          <Box key={index} sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" fontWeight="medium">
                {checklist.title}
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setSelectedChecklistIndex(index)}
                sx={{ textTransform: "none" }}
              >
                Thêm item
              </Button>
            </Box>
            <List dense>
              {checklist.items.map((item, itemIndex) => (
                <ListItem key={itemIndex} sx={{ py: 0.5 }}>
                  <Checkbox
                    checked={item.completed || false}
                    onChange={() => handleToggleChecklistItem(index, itemIndex)}
                  />
                  <ListItemText
                    primary={item.text}
                    sx={{
                      textDecoration: item.completed ? "line-through" : "none",
                      color: item.completed ? "text.secondary" : "text.primary",
                    }}
                  />
                </ListItem>
              ))}
            </List>
            {selectedChecklistIndex === index && (
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}
              >
                <TextField
                  label="Nội dung item"
                  value={checklistItemText}
                  onChange={(e) => setChecklistItemText(e.target.value)}
                  size="small"
                  fullWidth
                  disabled={loading}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleAddChecklistItem(index)}
                  disabled={loading || !checklistItemText.trim()}
                  sx={{ textTransform: "none" }}
                >
                  {loading ? <CircularProgress size={20} /> : "Thêm"}
                </Button>
              </Box>
            )}
            {error && selectedChecklistIndex === index && (
              <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
      <GenericDialog
        open={openChecklistDialog}
        onClose={() => setOpenChecklistDialog(false)}
        card={card}
        setCards={setCards}
        setColumns={setColumns}
        type="checklist"
      />
    </>
  );
}

export default ChecklistSection;
