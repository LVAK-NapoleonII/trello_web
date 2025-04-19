import { useState, useEffect } from "react";
import { Box, Radio, Typography, IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import EditCardDialog from "./EditCardDialog";

function CardHeader({ card, setCards, setColumns, setExpanded }) {
  const [isCompleted, setIsCompleted] = useState(card.completed || false);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  useEffect(() => {
    setIsCompleted(card.completed || false);
  }, [card.completed]);

  const handleToggleComplete = async (e) => {
    e.stopPropagation();
    const previousState = isCompleted;
    const newCompletedState = !isCompleted;
    setIsCompleted(newCompletedState);

    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("Không tìm thấy token! Vui lòng đăng nhập lại.");

      const response = await axios.put(
        `http://localhost:5000/api/cards/${card._id}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCards((prevCards) =>
        prevCards.map((c) =>
          c._id === card._id
            ? { ...c, completed: response.data.card.completed }
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
                    ? { ...c, completed: response.data.card.completed }
                    : c
                ),
              }
            : col
        )
      );
    } catch (err) {
      console.error("Error updating card completion:", err);
      setIsCompleted(previousState);
      alert(
        `Có lỗi khi cập nhật trạng thái hoàn thành: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  const handleOpenEditDialog = (e) => {
    e.stopPropagation();
    setOpenEditDialog(true);
  };

  const hasDetails = () => {
    return (
      card?.description ||
      card?.members?.length > 0 ||
      card?.comments?.length > 0 ||
      card?.notes?.length > 0 ||
      card?.checklists?.length > 0
    );
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          minHeight: "48px",
          gap: 1,
          p: 2,
          borderBottom: (theme) =>
            setExpanded ? `1px solid ${theme.palette.divider}` : "none",
        }}
      >
        <Radio
          checked={isCompleted}
          onChange={handleToggleComplete}
          onClick={(e) => e.stopPropagation()}
          sx={{
            color: isCompleted ? "success.main" : "text.secondary",
            "&.Mui-checked": { color: "success.main" },
          }}
        />
        <Typography
          variant="body1"
          sx={{
            textDecoration: isCompleted ? "line-through" : "none",
            color: isCompleted ? "text.secondary" : "text.primary",
            flex: 1,
            cursor: "pointer",
            fontWeight: 500,
            "&:hover": { color: "primary.main" },
          }}
          onClick={handleOpenEditDialog}
        >
          {card?.title}
        </Typography>
        {hasDetails() && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((prev) => !prev);
            }}
            sx={{ color: "text.secondary" }}
          >
            {setExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Box>
      <EditCardDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        card={card}
        setCards={setCards}
        setColumns={setColumns}
      />
    </>
  );
}

export default CardHeader;
