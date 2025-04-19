import { useState, useContext, useEffect } from "react";
import { Box, Collapse, CircularProgress } from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import AddMemberDialog from "./AddMemberDialog";
import { SocketContext } from "../../../../../../../context/SocketContext";
import DescriptionSection from "./DescriptionSection";
import DueDateSection from "./DueDateSection";
import MembersSection from "./MembersSection";
import LabelsSection from "./LabelsSection";
import NotesSection from "./NotesSection";
import ChecklistsSection from "./ChecklistsSection";
import CommentsSection from "./CommentsSection";

function CardDetails({
  card,
  setCards,
  setColumns,
  expanded,
  setExpanded,
  boardMembers,
}) {
  const { socket } = useContext(SocketContext);
  const [comment, setComment] = useState("");
  const [note, setNote] = useState("");
  const [checklistTitle, setChecklistTitle] = useState("");
  const [checklistItem, setChecklistItem] = useState("");
  const [openAddMemberDialog, setOpenAddMemberDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isBoardOwner, setIsBoardOwner] = useState(false);
  const [loading, setLoading] = useState({
    comment: false,
    note: false,
    checklist: false,
    checklistItem: false,
    checklistToggle: false,
    removeMember: false,
    user: true,
  });

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setLoading((prev) => ({ ...prev, user: true }));
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Không tìm thấy token!");
        const response = await axios.get(
          "http://localhost:5000/api/auth/profile",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCurrentUserId(response.data.user.id || response.data.user._id);
      } catch (err) {
        console.error("Error fetching current user:", err);
        toast.error("Không thể lấy thông tin người dùng hiện tại.");
      } finally {
        setLoading((prev) => ({ ...prev, user: false }));
      }
    };
    fetchCurrentUser();
  }, []);

  // Check if user is board owner
  useEffect(() => {
    const checkBoardOwner = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5000/api/boards/${card.board}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const board = response.data;
        const ownerId = board.owner._id
          ? board.owner._id.toString()
          : board.owner.toString();
        setIsBoardOwner(currentUserId === ownerId);
      } catch (err) {
        console.error("Error checking board owner:", err);
        toast.error("Không thể xác minh quyền chủ phòng!");
      }
    };
    if (card.board && currentUserId) {
      checkBoardOwner();
    }
  }, [card.board, currentUserId]);

  // Utility to update card state
  const updateCardState = (cardId, updatedFields) => {
    setCards((prevCards) =>
      prevCards.map((c) => (c._id === cardId ? { ...c, ...updatedFields } : c))
    );
    setColumns((prevColumns) =>
      prevColumns.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c._id === cardId ? { ...c, ...updatedFields } : c
        ),
      }))
    );
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("member-added", ({ cardId, members }) => {
      if (cardId === card._id) {
        updateCardState(cardId, { members });
      }
    });

    socket.on("member-removed-from-card", ({ cardId, memberId, message }) => {
      if (cardId === card._id) {
        updateCardState(cardId, {
          members: card.members.filter((m) => m._id.toString() !== memberId),
        });
        toast.info(message);
      }
    });

    socket.on("comment-added", ({ cardId, comment }) => {
      if (cardId === card._id) {
        updateCardState(cardId, {
          comments: [...(card.comments || []), comment],
        });
      }
    });

    socket.on("note-added", ({ cardId, note }) => {
      if (cardId === card._id) {
        updateCardState(cardId, {
          notes: [...(card.notes || []), note],
        });
      }
    });

    socket.on("checklist-added", ({ cardId, checklist }) => {
      if (cardId === card._id) {
        updateCardState(cardId, {
          checklists: [...(card.checklists || []), checklist],
        });
      }
    });

    socket.on(
      "checklist-item-added",
      ({ cardId, checklistIndex, checklist }) => {
        console.log("Received checklist-item-added:", {
          cardId,
          checklistIndex,
          checklist,
        });
        if (cardId === card._id) {
          updateCardState(cardId, {
            checklists: (card.checklists || []).map((cl, idx) =>
              idx === checklistIndex
                ? { ...cl, items: checklist.items || cl.items }
                : cl
            ),
          });
        }
      }
    );

    socket.on(
      "checklist-item-toggled",
      ({ cardId, checklistIndex, itemIndex, completed }) => {
        console.log("Received checklist-item-toggled:", {
          cardId,
          checklistIndex,
          itemIndex,
          completed,
        });
        if (cardId === card._id) {
          updateCardState(cardId, {
            checklists: (card.checklists || []).map((cl, idx) =>
              idx === checklistIndex
                ? {
                    ...cl,
                    items: (cl.items || []).map((item, i) =>
                      i === itemIndex ? { ...item, completed } : item
                    ),
                  }
                : cl
            ),
          });
        }
      }
    );

    return () => {
      socket.off("member-added");
      socket.off("member-removed-from-card");
      socket.off("comment-added");
      socket.off("note-added");
      socket.off("checklist-added");
      socket.off("checklist-item-added");
      socket.off("checklist-item-toggled");
    };
  }, [socket, card._id, card.members, updateCardState]);

  const isMemberInBoard = (memberId) => {
    if (!memberId || !boardMembers || !Array.isArray(boardMembers)) {
      return false;
    }
    return boardMembers.some(
      (boardMember) =>
        boardMember.user?._id?.toString() === memberId.toString() &&
        boardMember.isActive === true
    );
  };

  const handleAddComment = async () => {
    if (!comment.trim()) {
      toast.error("Bình luận không được để trống!");
      return;
    }

    setLoading((prev) => ({ ...prev, comment: true }));

    // Cập nhật state tạm thời
    const tempComment = {
      text: comment,
      user: { _id: currentUserId, fullName: "Bạn" },
      createdAt: new Date(),
    };
    updateCardState(card._id, {
      comments: [...(card.comments || []), tempComment],
    });

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/cards/${card._id}/comments`,
        { text: comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Cập nhật state với dữ liệu từ server
      updateCardState(card._id, { comments: response.data });

      if (socket) {
        socket.emit("comment-added", {
          cardId: card._id,
          comment: response.data,
        });
      }

      setComment("");
      toast.success("Thêm bình luận thành công!");
    } catch (err) {
      console.error("Error adding comment:", err);
      // Hoàn tác nếu có lỗi
      updateCardState(card._id, { comments: card.comments });
      toast.error(
        `Có lỗi khi thêm bình luận: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading((prev) => ({ ...prev, comment: false }));
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) {
      toast.error("Ghi chú không được để trống!");
      return;
    }

    setLoading((prev) => ({ ...prev, note: true }));

    // Cập nhật state tạm thời
    const tempNote = {
      content: note,
      createdBy: { _id: currentUserId, fullName: "Bạn" },
      createdAt: new Date(),
    };
    updateCardState(card._id, {
      notes: [...(card.notes || []), tempNote],
    });

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/cards/${card._id}/notes`,
        { content: note },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Cập nhật state với dữ liệu từ server
      updateCardState(card._id, { notes: response.data });

      if (socket) {
        socket.emit("note-added", {
          cardId: card._id,
          note: response.data,
        });
      }

      setNote("");
      toast.success("Thêm ghi chú thành công!");
    } catch (err) {
      console.error("Error adding note:", err);
      // Hoàn tác nếu có lỗi
      updateCardState(card._id, { notes: card.notes });
      toast.error(
        `Có lỗi khi thêm ghi chú: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setLoading((prev) => ({ ...prev, note: false }));
    }
  };

  const handleAddChecklist = async () => {
    if (!checklistTitle.trim()) {
      toast.error("Tiêu đề checklist không được để trống!");
      return;
    }

    setLoading((prev) => ({ ...prev, checklist: true }));

    // Cập nhật state tạm thời
    const tempChecklist = {
      title: checklistTitle,
      items: [],
      createdAt: new Date(),
    };
    updateCardState(card._id, {
      checklists: [...(card.checklists || []), tempChecklist],
    });

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/cards/${card._id}/checklists`,
        { title: checklistTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Cập nhật state với dữ liệu từ server
      updateCardState(card._id, { checklists: response.data });

      if (socket) {
        socket.emit("checklist-added", {
          cardId: card._id,
          checklist: response.data,
        });
      }

      setChecklistTitle("");
      toast.success("Thêm checklist thành công!");
    } catch (err) {
      console.error("Error adding checklist:", err);
      // Hoàn tác nếu có lỗi
      updateCardState(card._id, { checklists: card.checklists });
      toast.error(
        `Có lỗi khi thêm checklist: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading((prev) => ({ ...prev, checklist: false }));
    }
  };

  const handleAddChecklistItem = async (checklistIndex) => {
    if (!checklistItem.trim()) {
      toast.error("Item checklist không được để trống!");
      return;
    }
    if (!card.checklists?.[checklistIndex]) {
      toast.error("Checklist không tồn tại!");
      return;
    }

    setLoading((prev) => ({ ...prev, checklistItem: true }));

    // Sao chép sâu checklists để đảm bảo re-render
    const currentChecklists = JSON.parse(JSON.stringify(card.checklists || []));
    const newItem = {
      text: checklistItem,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    currentChecklists[checklistIndex] = {
      ...currentChecklists[checklistIndex],
      items: [...(currentChecklists[checklistIndex].items || []), newItem],
    };
    updateCardState(card._id, { checklists: currentChecklists });

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/cards/${card._id}/checklists/${checklistIndex}/items`,
        { text: checklistItem },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Add checklist item response:", response.data);

      // Xử lý response.data là mảng checklists hoặc object checklist
      let updatedChecklist;
      if (Array.isArray(response.data)) {
        updatedChecklist =
          response.data[checklistIndex] || currentChecklists[checklistIndex];
      } else {
        updatedChecklist = response.data;
      }
      updateCardState(card._id, {
        checklists: (card.checklists || []).map((cl, idx) =>
          idx === checklistIndex
            ? { ...cl, items: updatedChecklist.items || cl.items }
            : cl
        ),
      });

      if (socket) {
        socket.emit("checklist-item-added", {
          cardId: card._id,
          checklistIndex,
          checklist: {
            ...currentChecklists[checklistIndex],
            items:
              updatedChecklist.items || currentChecklists[checklistIndex].items,
          },
        });
      }

      setChecklistItem("");
      toast.success("Thêm item checklist thành công!");
    } catch (err) {
      console.error("Error adding checklist item:", err);
      // Hoàn tác nếu có lỗi
      updateCardState(card._id, { checklists: card.checklists });
      toast.error(
        `Có lỗi khi thêm item checklist: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading((prev) => ({ ...prev, checklistItem: false }));
    }
  };

  const handleToggleChecklistItem = async (checklistIndex, itemIndex) => {
    if (!card.checklists?.[checklistIndex]?.items?.[itemIndex]) {
      toast.error("Checklist item không tồn tại!");
      return;
    }

    setLoading((prev) => ({ ...prev, checklistToggle: true }));

    // Sao chép sâu checklists để đảm bảo re-render
    const currentChecklists = JSON.parse(JSON.stringify(card.checklists || []));
    const newCompleted =
      !currentChecklists[checklistIndex].items[itemIndex].completed;
    currentChecklists[checklistIndex].items[itemIndex] = {
      ...currentChecklists[checklistIndex].items[itemIndex],
      completed: newCompleted,
    };
    updateCardState(card._id, { checklists: currentChecklists });

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/cards/${card._id}/checklists/${checklistIndex}/items/${itemIndex}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Toggle checklist item response:", response.data);

      // Xử lý response.data là mảng checklists hoặc object checklist
      let updatedChecklist;
      if (Array.isArray(response.data)) {
        updatedChecklist =
          response.data[checklistIndex] || currentChecklists[checklistIndex];
      } else {
        updatedChecklist = response.data;
      }
      updateCardState(card._id, {
        checklists: (card.checklists || []).map((cl, idx) =>
          idx === checklistIndex
            ? { ...cl, items: updatedChecklist.items || cl.items }
            : cl
        ),
      });

      if (socket) {
        socket.emit("checklist-item-toggled", {
          cardId: card._id,
          checklistIndex,
          itemIndex,
          completed: newCompleted,
        });
      }

      toast.success("Cập nhật trạng thái item checklist thành công!");
    } catch (err) {
      console.error("Error toggling checklist item:", err);
      // Hoàn tác nếu có lỗi
      updateCardState(card._id, { checklists: card.checklists });
      toast.error(
        `Có lỗi khi cập nhật trạng thái item checklist: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading((prev) => ({ ...prev, checklistToggle: false }));
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Bạn có chắc muốn xóa thành viên này khỏi card?"))
      return;

    setLoading((prev) => ({ ...prev, removeMember: true }));

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `http://localhost:5000/api/cards/${card._id}/members/${memberId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateCardState(card._id, { members: response.data.members });

      if (socket) {
        socket.emit("member-removed-from-card", {
          cardId: card._id,
          memberId,
        });
      }

      toast.success("Xóa thành viên khỏi card thành công!");
    } catch (err) {
      console.error("Error removing member from card:", err);
      toast.error(
        `Có lỗi khi xóa thành viên: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading((prev) => ({ ...prev, removeMember: false }));
    }
  };

  return (
    <Collapse in={expanded} timeout="auto" unmountOnExit>
      <Box
        sx={{
          p: 3,
          bgcolor: "background.paper",
          borderRadius: 2,
          maxHeight: "400px",
          overflowY: "auto",
          boxShadow: 3,
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "grey.100",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "grey.400",
            borderRadius: "10px",
            "&:hover": {
              backgroundColor: "grey.500",
            },
          },
        }}
      >
        {card.description && (
          <DescriptionSection description={card.description} />
        )}
        {card.dueDate && <DueDateSection dueDate={card.dueDate} />}
        <MembersSection
          members={card.members}
          boardMembers={boardMembers}
          isBoardOwner={isBoardOwner}
          loading={loading}
          handleRemoveMember={handleRemoveMember}
          setOpenAddMemberDialog={setOpenAddMemberDialog}
          isMemberInBoard={isMemberInBoard}
        />
        {card.labels?.length > 0 && <LabelsSection labels={card.labels} />}
        <NotesSection
          notes={card.notes}
          note={note}
          setNote={setNote}
          loading={loading}
          handleAddNote={handleAddNote}
          isMemberInBoard={isMemberInBoard}
        />
        <ChecklistsSection
          checklists={card.checklists}
          checklistTitle={checklistTitle}
          setChecklistTitle={setChecklistTitle}
          checklistItem={checklistItem}
          setChecklistItem={setChecklistItem}
          loading={loading}
          handleAddChecklist={handleAddChecklist}
          handleAddChecklistItem={handleAddChecklistItem}
          handleToggleChecklistItem={handleToggleChecklistItem}
        />
        <CommentsSection
          comments={card.comments}
          comment={comment}
          setComment={setComment}
          loading={loading}
          handleAddComment={handleAddComment}
          isMemberInBoard={isMemberInBoard}
        />
        <AddMemberDialog
          open={openAddMemberDialog}
          onClose={() => setOpenAddMemberDialog(false)}
          card={card}
          setCards={setCards}
          setColumns={setColumns}
          boardMembers={boardMembers}
        />
      </Box>
    </Collapse>
  );
}

export default CardDetails;
