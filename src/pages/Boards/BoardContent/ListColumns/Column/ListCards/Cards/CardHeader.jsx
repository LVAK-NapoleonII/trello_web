import { useState, useEffect, useContext } from "react";
import { Box, Radio, Typography, IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { toast } from "react-toastify";
import EditCardDialog from "./EditCardDialog";
import { SocketContext } from "../../../../../../../context/SocketContext";

function CardHeader({ card, setCards, setColumns, setExpanded }) {
  const { socket, socketReady } = useContext(SocketContext);
  const [isCompleted, setIsCompleted] = useState(card.completed || false);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  useEffect(() => {
    setIsCompleted(card.completed || false);
  }, [card.completed]);

  useEffect(() => {
    if (!socket || !socketReady) {
      console.warn("CardHeader: Socket not available or not ready");
      return;
    }

    // Xử lý khi trạng thái hoàn thành thay đổi
    const handleCardCompletionToggled = ({ cardId, completed }) => {
      if (cardId === card._id) {
        console.log("CardHeader: Received card-completion-toggled:", {
          cardId,
          completed,
        });
        setIsCompleted(completed);
        setCards((prevCards) =>
          prevCards.map((c) => (c._id === cardId ? { ...c, completed } : c))
        );
        setColumns((prevColumns) =>
          prevColumns.map((col) =>
            col._id === card.list
              ? {
                  ...col,
                  cards: col.cards.map((c) =>
                    c._id === cardId ? { ...c, completed } : c
                  ),
                }
              : col
          )
        );
        toast.info(
          `Thẻ đã được ${completed ? "đánh dấu hoàn thành" : "bỏ hoàn thành"}.`
        );
      }
    };

    // Xử lý khi thẻ được cập nhật (ví dụ: tiêu đề)
    const handleCardUpdated = ({ cardId, card: updatedCard }) => {
      if (cardId === card._id) {
        console.log("CardHeader: Received card-updated:", {
          cardId,
          updatedCard,
        });
        setCards((prevCards) =>
          prevCards.map((c) =>
            c._id === cardId ? { ...c, ...updatedCard } : c
          )
        );
        setColumns((prevColumns) =>
          prevColumns.map((col) =>
            col._id === card.list
              ? {
                  ...col,
                  cards: col.cards.map((c) =>
                    c._id === cardId ? { ...c, ...updatedCard } : c
                  ),
                }
              : col
          )
        );
        toast.info("Tiêu đề thẻ đã được cập nhật.");
      }
    };

    socket.on("card-completion-toggled", handleCardCompletionToggled);
    socket.on("card-updated", handleCardUpdated);

    return () => {
      socket.off("card-completion-toggled", handleCardCompletionToggled);
      socket.off("card-updated", handleCardUpdated);
    };
  }, [socket, socketReady, card._id, card.list, setCards, setColumns]);

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

      if (socket && socketReady) {
        socket.emit("card-completion-toggled", {
          cardId: card._id,
          completed: response.data.card.completed,
        });
      }
    } catch (err) {
      console.error("Error updating card completion:", err);
      setIsCompleted(previousState);
      toast.error(
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
