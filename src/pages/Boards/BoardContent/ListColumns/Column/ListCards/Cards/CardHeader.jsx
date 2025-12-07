import { useState, useEffect, useContext, useMemo } from "react";
import {
  Box,
  Radio,
  Typography,
  IconButton,
  Chip,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LockIcon from "@mui/icons-material/Lock";
import axios from "axios";
import { toast } from "react-toastify";
import EditCardDialog from "./EditCardDialog";
import CardCover from "./CardCover";
import { SocketContext } from "../../../../../../../context/SocketContext";

function CardHeader({ card, setColumns, setExpanded, currentUserId, isBoardOwner }) {
  const { socket, socketReady } = useContext(SocketContext);
  const [isCompleted, setIsCompleted] = useState(card.completed || false);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  // Kiểm tra xem user hiện tại có phải là thành viên của card không
  const isCardMember = useMemo(() => {
    if (!currentUserId || !card?.members || !Array.isArray(card.members)) {
      return false;
    }

    const result = card.members.some((m) => {
      const memberId = m._id?.toString();
      const userId = currentUserId?.toString();
      return memberId === userId;
    });
    return result;
  }, [card?.members, currentUserId, card._id]);

  // Quyền đánh dấu hoàn thành = (là thành viên của card) HOẶC (là chủ board)
  const canToggleComplete = useMemo(() => {
    const result = isCardMember || isBoardOwner;
    return result;
  }, [isCardMember, isBoardOwner, card._id]);

  useEffect(() => {
    setIsCompleted(card.completed || false);
  }, [card.completed]);

  useEffect(() => {
    if (!socket || !socketReady) return;

    const handleCardCompletionToggled = ({ cardId, completed }) => {
      if (cardId !== card._id) return;
      setIsCompleted(completed);
      updateCardInColumns({ completed });
      toast.info(`Thẻ đã được ${completed ? "hoàn thành" : "bỏ hoàn thành"}.`);
    };

    const handleCardUpdated = ({ card: updatedCard }) => {
      if (updatedCard._id !== card._id) return;
      updateCardInColumns(updatedCard);
      toast.info("Thẻ đã được cập nhật.");
    };

    socket.on("card-completion-toggled", handleCardCompletionToggled);
    socket.on("card-updated", handleCardUpdated);

    return () => {
      socket.off("card-completion-toggled", handleCardCompletionToggled);
      socket.off("card-updated", handleCardUpdated);
    };
  }, [socket, socketReady, card._id, card.list, setColumns]);

  const updateCardInColumns = (updates) => {
    setColumns((prev) =>
      prev.map((col) =>
        col._id === card.list
          ? {
            ...col,
            cards: col.cards.map((c) =>
              c._id === card._id ? { ...c, ...updates } : c
            ),
          }
          : col
      )
    );
  };

  const handleToggleComplete = async (e) => {
    e.stopPropagation();

    if (!canToggleComplete) {
      toast.warning("Chỉ thành viên của thẻ mới được phép đánh dấu hoàn thành!");
      return;
    }

    const newState = !isCompleted;
    setIsCompleted(newState);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token!");

      const { data } = await axios.put(
        `http://localhost:5000/api/cards/${card._id}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateCardInColumns({ completed: data.card.completed });

      if (socket && socketReady) {
        socket.emit("card-completion-toggled", {
          cardId: card._id,
          completed: data.card.completed,
          actorId: localStorage.getItem("userId"),
        });
      }
    } catch (err) {
      setIsCompleted(!newState);
      toast.error("Lỗi khi cập nhật trạng thái hoàn thành!");
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

  const getDueDateStatus = () => {
    if (!card.dueDate || isCompleted) return null;

    const now = new Date();
    const dueDate = new Date(card.dueDate);
    const diffHours = (dueDate - now) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return { status: "overdue", label: "Quá hạn", color: "error" };
    } else if (diffHours <= 24) {
      return { status: "soon", label: "Sắp hết hạn", color: "warning" };
    } else if (diffHours <= 72) {
      return { status: "upcoming", label: formatDueDate(dueDate), color: "info" };
    }
    return null;
  };

  const formatDueDate = (date) => {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  };

  const dueDateStatus = getDueDateStatus();

  return (
    <>
      <CardCover cover={card.cover} onClick={handleOpenEditDialog} />

      {/* Header chính */}
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
        <Tooltip
          title={canToggleComplete ? "" : "Chỉ thành viên của thẻ mới có thể đánh dấu hoàn thành"}
          arrow
        >
          <span>
            <Radio
              checked={isCompleted}
              onChange={handleToggleComplete}
              onClick={(e) => e.stopPropagation()}
              disabled={!canToggleComplete}
              sx={{
                color: isCompleted ? "success.main" : "text.secondary",
                "&.Mui-checked": { color: "success.main" },
                "&.Mui-disabled": {
                  color: "action.disabled",
                  opacity: 0.5,
                },
              }}
            />
          </span>
        </Tooltip>

        {!canToggleComplete && (
          <LockIcon
            sx={{
              fontSize: 16,
              color: "text.secondary",
              opacity: 0.6,
            }}
          />
        )}

        <Box sx={{ flex: 1 }}>
          <Typography
            variant="body1"
            sx={{
              textDecoration: isCompleted ? "line-through" : "none",
              color: isCompleted ? "text.secondary" : "text.primary",
              cursor: "pointer",
              fontWeight: 500,
              "&:hover": { color: "primary.main" },
            }}
            onClick={handleOpenEditDialog}
          >
            {card?.title}
          </Typography>

          {dueDateStatus && (
            <Chip
              icon={
                dueDateStatus.status === "overdue" ? (
                  <WarningAmberIcon />
                ) : (
                  <AccessTimeIcon />
                )
              }
              label={dueDateStatus.label}
              size="small"
              color={dueDateStatus.color}
              sx={{
                mt: 0.5,
                height: 24,
                fontSize: "0.75rem",
              }}
            />
          )}
        </Box>

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
        key={card._id}
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        card={card}
        setColumns={setColumns}
        currentUserId={currentUserId}
        isCardMember={isCardMember}
        isBoardOwner={isBoardOwner}
      />
    </>
  );
}

export default CardHeader;