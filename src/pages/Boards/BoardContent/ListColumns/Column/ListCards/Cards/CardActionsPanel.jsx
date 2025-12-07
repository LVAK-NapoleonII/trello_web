import { useState, useContext, useMemo } from "react";
import { CardActions, Chip, IconButton, Tooltip, Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Groups3Icon from "@mui/icons-material/Groups3";
import AssistantIcon from "@mui/icons-material/Assistant";
import AttachmentIcon from "@mui/icons-material/Attachment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LockIcon from "@mui/icons-material/Lock";
import axios from "axios";
import { toast } from "react-toastify";
import EditCardDialog from "./EditCardDialog";
import { SocketContext } from "../../../../../../../context/SocketContext";
import { Stack } from "@mui/system";

function CardActionsPanel({
  card,
  setColumns,
  boardMembers,
  boardId,
  currentUserId,        // <<< THÊM PROP NÀY (rất quan trọng)
  isBoardOwner = false, // <<< THÊM PROP NÀY (từ component cha truyền vào)
}) {
  const { socket, socketReady } = useContext(SocketContext);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [loading, setLoading] = useState({
    delete: false,
    toggleComplete: false,
  });

  // Kiểm tra người dùng hiện tại có phải là thành viên của CARD không
  const isCardMember = useMemo(() => {
    return card?.members?.some(
      (m) => m._id?.toString() === currentUserId?.toString()
    );
  }, [card?.members, currentUserId]);

  // Quyền đánh dấu hoàn thành: là thành viên card HOẶC là owner board
  const canToggleComplete = isCardMember || isBoardOwner;

  const normalizeUser = (user) => ({
    _id: user?._id || "unknown",
    fullName: user?.fullName || user?.email || "Unknown User",
    avatar: user?.avatar || "",
    email: user?.email || "",
  });

  const isMemberInBoard = (memberId) => {
    if (!memberId || !boardMembers?.length) return false;
    const boardMember = boardMembers.find(
      (bm) => (bm.user?._id || bm._id)?.toString() === memberId.toString()
    );
    return boardMember?.isActive !== false;
  };

  const activeMembersCount = useMemo(() => {
    return (card?.members || []).filter((m) => isMemberInBoard(m._id)).length;
  }, [card?.members, boardMembers]);

  const membersTooltip = useMemo(() => {
    return (card?.members || [])
      .map(normalizeUser)
      .map(
        (m) =>
          `${m.fullName} (${isMemberInBoard(m._id) ? "Còn trong bảng" : "Không còn trong bảng"})`
      )
      .join(", ");
  }, [card?.members, boardMembers]);

  const handleDeleteCard = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thẻ này?")) return;

    setLoading((prev) => ({ ...prev, delete: true }));
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/cards/${card._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          cards: col.cards.filter((c) => c._id !== card._id),
        }))
      );

      socket?.emit("card-deleted", { boardId, listId: card.list, cardId: card._id });
      toast.success("Xóa thẻ thành công!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa thẻ thất bại");
    } finally {
      setLoading((prev) => ({ ...prev, delete: false }));
    }
  };

  const handleToggleComplete = async () => {
    if (!canToggleComplete) {
      toast.warn("Bạn không có quyền đánh dấu hoàn thành thẻ này!");
      return;
    }

    setLoading((prev) => ({ ...prev, toggleComplete: true }));
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `http://localhost:5000/api/cards/${card._id}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          cards: col.cards.map((c) =>
            c._id === card._id
              ? { ...c, completed: res.data.card.completed }
              : c
          ),
        }))
      );

      socket?.emit("card-completion-toggled", {
        cardId: card._id,
        completed: res.data.card.completed,
      });

      toast.success(
        res.data.card.completed
          ? "Đánh dấu hoàn thành thành công!"
          : "Bỏ hoàn thành thành công!"
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật thất bại");
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
      card?.completed ||
      canToggleComplete // Thêm để owner luôn thấy nút hoàn thành
    );
  };

  if (!shouldShowCardActions()) return null;

  return (
    <CardActions sx={{ p: 1, bgcolor: "background.paper" }}>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
        {/* Các Chip thông tin */}
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          {(card?.members || []).length > 0 && (
            <Tooltip title={membersTooltip}>
              <Chip
                icon={<Groups3Icon />}
                label={`${activeMembersCount}/${(card?.members || []).length}`}
                size="small"
                color="info"
                onClick={(e) => e.stopPropagation()}
              />
            </Tooltip>
          )}
          {(card?.comments || []).length > 0 && (
            <Chip icon={<AssistantIcon />} label={card.comments.length} size="small" color="secondary" />
          )}
          {(card?.attachments || []).length > 0 && (
            <Chip icon={<AttachmentIcon />} label={card.attachments.length} size="small" color="warning" />
          )}
          {(card?.checklists || []).length > 0 && (
            <Chip
              icon={<CheckCircleIcon />}
              label={card.checklists.reduce((t, cl) => t + (cl.items || []).length, 0)}
              size="small"
              color="success"
            />
          )}
        </Stack>

        {/* Nút hành động */}
        <Stack direction="row" spacing={0.5}>
          {/* Nút đánh dấu hoàn thành - có kiểm tra quyền */}
          <Tooltip
            title={
              canToggleComplete
                ? card.completed
                  ? "Bỏ hoàn thành"
                  : "Đánh dấu hoàn thành"
                : "Chỉ thành viên thẻ hoặc chủ board mới được đánh dấu hoàn thành"
            }
          >
            <Box>
              <IconButton
                size="small"
                onClick={handleToggleComplete}
                disabled={!canToggleComplete || loading.toggleComplete}
                sx={{
                  color: card.completed
                    ? "success.main"
                    : canToggleComplete
                      ? "action.active"
                      : "action.disabled",
                }}
              >
                {card.completed ? (
                  <CheckCircleIcon fontSize="small" />
                ) : canToggleComplete ? (
                  <CheckCircleOutlineIcon fontSize="small" />
                ) : (
                  <LockIcon fontSize="small" />
                )}
              </IconButton>
            </Box>
          </Tooltip>

          {/* Nút sửa */}
          <Tooltip title="Chỉnh sửa thẻ">
            <IconButton size="small" onClick={() => setOpenEditDialog(true)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Nút xóa */}
          <Tooltip title="Xóa thẻ">
            <IconButton size="small" onClick={handleDeleteCard} disabled={loading.delete}>
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <EditCardDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        card={card}
        setColumns={setColumns}
        currentUserId={currentUserId}
        isCardMember={isCardMember}
        isBoardOwner={isBoardOwner}
      />
    </CardActions>
  );
}

export default CardActionsPanel;