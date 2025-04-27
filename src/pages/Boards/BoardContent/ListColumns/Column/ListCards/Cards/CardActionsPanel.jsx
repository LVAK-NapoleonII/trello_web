import { useState, useContext } from "react";
import { CardActions, Chip, IconButton, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Groups3Icon from "@mui/icons-material/Groups3";
import AssistantIcon from "@mui/icons-material/Assistant";
import AttachmentIcon from "@mui/icons-material/Attachment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axios from "axios";
import { toast } from "react-toastify";
import EditCardDialog from "./EditCardDialog";
import { SocketContext } from "../../../../../../../context/SocketContext";
import { Stack } from "@mui/system";

function CardActionsPanel({
  card,
  setCards,
  setColumns,
  boardMembers,
  boardId,
}) {
  const { socket, socketReady } = useContext(SocketContext);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [loading, setLoading] = useState({
    delete: false,
    toggleComplete: false,
  });

  const normalizeUser = (user) => ({
    _id: user?._id || "unknown",
    fullName: user?.fullName || user?.email || "Unknown User",
    avatar: user?.avatar || "",
    email: user?.email || "",
  });

  const isMemberInBoard = (memberId) => {
    if (!memberId || !boardMembers?.length) {
      console.log("isMemberInBoard: Invalid input", { memberId, boardMembers });
      return false;
    }
    const boardMember = boardMembers.find(
      (boardMember) =>
        (boardMember.user?._id || boardMember._id)?.toString() ===
        memberId.toString()
    );
    if (!boardMember) {
      console.log(`isMemberInBoard: No matching member found for ${memberId}`);
      return false;
    }
    const isActive =
      boardMember.isActive !== undefined ? boardMember.isActive : true;
    console.log(`isMemberInBoard: Member ${memberId}, isActive: ${isActive}`);
    return isActive;
  };

  const handleDeleteCard = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thẻ này?")) return;

    setLoading((prev) => ({ ...prev, delete: true }));

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/cards/${card._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCards((prevCards) => prevCards.filter((c) => c._id !== card._id));
      setColumns((prevColumns) =>
        prevColumns.map((col) => ({
          ...col,
          cards: col.cards.filter((c) => c._id !== card._id),
        }))
      );

      if (socket && socketReady) {
        socket.emit("card-deleted", {
          boardId,
          listId: card.list,
          cardId: card._id,
        });
      }

      toast.success("Xóa thẻ thành công!");
    } catch (err) {
      console.error("Error deleting card:", err);
      toast.error(
        `Có lỗi khi xóa thẻ: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setLoading((prev) => ({ ...prev, delete: false }));
    }
  };

  const handleToggleComplete = async () => {
    setLoading((prev) => ({ ...prev, toggleComplete: true }));

    try {
      const token = localStorage.getItem("token");
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
        prevColumns.map((col) => ({
          ...col,
          cards: col.cards.map((c) =>
            c._id === card._id
              ? { ...c, completed: response.data.card.completed }
              : c
          ),
        }))
      );

      if (socket && socketReady) {
        socket.emit("card-completion-toggled", {
          cardId: card._id,
          completed: response.data.card.completed,
        });
      }

      toast.success("Cập nhật trạng thái hoàn thành thẻ thành công!");
    } catch (err) {
      console.error("Error toggling card completion:", err);
      toast.error(
        `Có lỗi khi cập nhật trạng thái hoàn thành: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading((prev) => ({ ...prev, toggleComplete: false }));
    }
  };

  const shouldShowCardActions = () => {
    return (
      (card?.members || []).length > 0 ||
      (card?.comments || []).length > 0 ||
      (card?.attachments || []).length > 0 ||
      (card?.notes || []).length > 0 ||
      (card?.checklists || []).length > 0 ||
      card?.completed
    );
  };

  const activeMembersCount = (card?.members || []).filter((member) =>
    isMemberInBoard(member._id)
  ).length;

  const membersTooltip = (card?.members || [])
    .map((member) => ({
      ...normalizeUser(member),
    }))
    .map(
      (member) =>
        `${member.fullName} (${
          isMemberInBoard(member._id)
            ? "Còn trong bảng"
            : "Không còn trong bảng"
        })`
    )
    .join(", ");

  if (!shouldShowCardActions()) return null;

  return (
    <CardActions
      sx={{
        p: 1,
        bgcolor: (theme) => theme.palette.background.paper,
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          {(card?.members || []).length > 0 && (
            <Tooltip title={membersTooltip}>
              <Chip
                icon={<Groups3Icon />}
                label={`${activeMembersCount}/${(card?.members || []).length}`}
                size="small"
                sx={{
                  bgcolor: (theme) =>
                    theme.palette.mode === "light"
                      ? theme.palette.info.light
                      : theme.palette.info.dark,
                  color: (theme) => theme.palette.info.contrastText,
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </Tooltip>
          )}
          {(card?.comments || []).length > 0 && (
            <Chip
              icon={<AssistantIcon />}
              label={(card?.comments || []).length}
              size="small"
              sx={{
                bgcolor: (theme) =>
                  theme.palette.mode === "light"
                    ? theme.palette.secondary.light
                    : theme.palette.secondary.dark,
                color: (theme) => theme.palette.secondary.contrastText,
              }}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {(card?.attachments || []).length > 0 && (
            <Chip
              icon={<AttachmentIcon />}
              label={(card?.attachments || []).length}
              size="small"
              sx={{
                bgcolor: (theme) =>
                  theme.palette.mode === "light"
                    ? theme.palette.warning.light
                    : theme.palette.warning.dark,
                color: (theme) => theme.palette.warning.contrastText,
              }}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {(card?.checklists || []).length > 0 && (
            <Chip
              icon={<CheckCircleIcon />}
              label={(card.checklists || []).reduce(
                (total, cl) => total + (cl.items || []).length,
                0
              )}
              size="small"
              sx={{
                bgcolor: (theme) =>
                  theme.palette.mode === "light"
                    ? theme.palette.success.light
                    : theme.palette.success.dark,
                color: (theme) => theme.palette.success.contrastText,
              }}
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </Stack>

        <Stack direction="row" spacing={1}>
          <Tooltip
            title={card.completed ? "Bỏ hoàn thành" : "Đánh dấu hoàn thành"}
          >
            <IconButton
              size="small"
              onClick={handleToggleComplete}
              disabled={loading.toggleComplete}
              sx={{
                color: card.completed
                  ? (theme) => theme.palette.success.main
                  : (theme) => theme.palette.action.active,
              }}
            >
              <CheckCircleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chỉnh sửa thẻ">
            <IconButton
              size="small"
              onClick={() => setOpenEditDialog(true)}
              sx={{
                color: (theme) => theme.palette.action.active,
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa thẻ">
            <IconButton
              size="small"
              onClick={handleDeleteCard}
              disabled={loading.delete}
              sx={{
                color: (theme) => theme.palette.error.main,
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <EditCardDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        card={card}
        setCards={setCards}
        setColumns={setColumns}
      />
    </CardActions>
  );
}

export default CardActionsPanel;
