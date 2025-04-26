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
  setBoardMembers,
}) {
  const { socket, socketReady } = useContext(SocketContext);
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
  const [localBoardMembers, setLocalBoardMembers] = useState([]);

  useEffect(() => {
    if (boardMembers && Array.isArray(boardMembers)) {
      const uniqueBoardMembers = boardMembers.reduce((acc, member) => {
        const memberId = member.user?._id || member._id;
        const existingMember = acc.find(
          (m) => (m.user?._id || m._id).toString() === memberId.toString()
        );
        if (!existingMember) {
          acc.push(member);
        } else if (member.isActive === false) {
          acc = acc.filter(
            (m) => (m.user?._id || m._id).toString() !== memberId.toString()
          );
          acc.push(member);
        }
        return acc;
      }, []);
      console.log(
        "boardMembers in CardDetails:",
        JSON.stringify(boardMembers, null, 2)
      );
      console.log(
        "Unique boardMembers:",
        JSON.stringify(uniqueBoardMembers, null, 2)
      );
      setLocalBoardMembers(uniqueBoardMembers);
    } else {
      console.warn("boardMembers is invalid or empty:", boardMembers);
      setLocalBoardMembers([]);
    }
  }, [boardMembers]);

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
        console.error("Lỗi lấy thông tin người dùng:", err);
        toast.error("Không thể lấy thông tin người dùng hiện tại.");
      } finally {
        setLoading((prev) => ({ ...prev, user: false }));
      }
    };
    fetchCurrentUser();
  }, []);

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
        console.error("Lỗi kiểm tra chủ phòng:", err);
        toast.error("Không thể xác minh quyền chủ phòng!");
      }
    };
    if (card.board && currentUserId) {
      checkBoardOwner();
    }
  }, [card.board, currentUserId]);

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

  const isMemberInBoard = (memberId) => {
    if (!memberId || !localBoardMembers || !Array.isArray(localBoardMembers)) {
      console.log("isMemberInBoard: Invalid input", {
        memberId,
        localBoardMembers,
      });
      return false;
    }

    const boardMember = localBoardMembers.find((boardMember) => {
      const memberIdFromBoard = boardMember.user?._id || boardMember._id;
      return memberIdFromBoard?.toString() === memberId.toString();
    });

    if (!boardMember) {
      console.log(`isMemberInBoard: No matching member found for ${memberId}`);
      return false;
    }

    const isActive =
      boardMember.isActive !== undefined ? boardMember.isActive : true;
    console.log(
      `isMemberInBoard: Checking member ${memberId}, isActive: ${isActive}`
    );

    return isActive;
  };

  const handleEditChecklist = async (checklistIndex, newTitle) => {
    if (!newTitle.trim()) {
      toast.error("Tiêu đề checklist không được để trống!");
      return;
    }

    setLoading((prev) => ({ ...prev, checklist: true }));

    const currentChecklists = JSON.parse(JSON.stringify(card.checklists || []));
    if (!currentChecklists[checklistIndex]) {
      toast.error("Checklist không tồn tại!");
      setLoading((prev) => ({ ...prev, checklist: false }));
      return;
    }
    currentChecklists[checklistIndex] = {
      ...currentChecklists[checklistIndex],
      title: newTitle,
    };
    updateCardState(card._id, { checklists: currentChecklists });

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/cards/${card._id}/checklists/${checklistIndex}`,
        { title: newTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateCardState(card._id, { checklists: response.data });

      if (socket && socketReady) {
        socket.emit("checklist-updated", {
          cardId: card._id,
          checklistIndex,
          title: newTitle,
        });
      }

      toast.success("Cập nhật tiêu đề checklist thành công!");
    } catch (err) {
      console.error("Lỗi cập nhật checklist:", err);
      updateCardState(card._id, { checklists: card.checklists });
      toast.error(
        `Có lỗi khi cập nhật checklist: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading((prev) => ({ ...prev, checklist: false }));
    }
  };

  const handleDeleteChecklist = async (checklistIndex) => {
    setLoading((prev) => ({ ...prev, checklist: true }));

    const currentChecklists = JSON.parse(JSON.stringify(card.checklists || []));
    currentChecklists.splice(checklistIndex, 1);
    updateCardState(card._id, { checklists: currentChecklists });

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `http://localhost:5000/api/cards/${card._id}/checklists/${checklistIndex}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateCardState(card._id, { checklists: response.data });

      if (socket && socketReady) {
        socket.emit("checklist-deleted", {
          cardId: card._id,
          checklistIndex,
        });
      }

      toast.success("Xóa checklist thành công!");
    } catch (err) {
      console.error("Lỗi xóa checklist:", err);
      updateCardState(card._id, { checklists: card.checklists });
      toast.error(
        `Có lỗi khi xóa checklist: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading((prev) => ({ ...prev, checklist: false }));
    }
  };

  const handleEditChecklistItem = async (
    checklistIndex,
    itemIndex,
    newText
  ) => {
    if (!newText.trim()) {
      toast.error("Nội dung item không được để trống!");
      return;
    }

    setLoading((prev) => ({ ...prev, checklistItem: true }));

    const currentChecklists = JSON.parse(JSON.stringify(card.checklists || []));
    currentChecklists[checklistIndex].items[itemIndex] = {
      ...currentChecklists[checklistIndex].items[itemIndex],
      text: newText,
    };
    updateCardState(card._id, { checklists: currentChecklists });

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/cards/${card._id}/checklists/${checklistIndex}/items/${itemIndex}`,
        { text: newText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateCardState(card._id, { checklists: response.data });

      if (socket && socketReady) {
        socket.emit("checklist-item-updated", {
          cardId: card._id,
          checklistIndex,
          itemIndex,
          text: newText,
        });
      }

      toast.success("Cập nhật item checklist thành công!");
    } catch (err) {
      console.error("Lỗi cập nhật item checklist:", err);
      updateCardState(card._id, { checklists: card.checklists });
      toast.error(
        `Có lỗi khi cập nhật item checklist: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading((prev) => ({ ...prev, checklistItem: false }));
    }
  };

  const handleDeleteChecklistItem = async (checklistIndex, itemIndex) => {
    setLoading((prev) => ({ ...prev, checklistItem: true }));

    const currentChecklists = JSON.parse(JSON.stringify(card.checklists || []));
    currentChecklists[checklistIndex].items.splice(itemIndex, 1);
    updateCardState(card._id, { checklists: currentChecklists });

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `http://localhost:5000/api/cards/${card._id}/checklists/${checklistIndex}/items/${itemIndex}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateCardState(card._id, { checklists: response.data });

      if (socket && socketReady) {
        socket.emit("checklist-item-deleted", {
          cardId: card._id,
          checklistIndex,
          itemIndex,
        });
      }

      toast.success("Xóa item checklist thành công!");
    } catch (err) {
      console.error("Lỗi xóa item checklist:", err);
      updateCardState(card._id, { checklists: card.checklists });
      toast.error(
        `Có lỗi khi xóa item checklist: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading((prev) => ({ ...prev, checklistItem: false }));
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (memberId === currentUserId) {
      toast.error("Bạn không thể xóa chính mình khỏi thẻ!");
      return;
    }

    if (!window.confirm("Bạn có chắc muốn xóa thành viên này khỏi card?"))
      return;

    setLoading((prev) => ({ ...prev, removeMember: true }));

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `http://localhost:5000/api/cards/${card._id}/members/${memberId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateCardState(card._id, { members: response.data });

      if (socket && socketReady) {
        socket.emit("member-removed-from-card", {
          cardId: card._id,
          memberId,
          message: "Thành viên đã được xóa khỏi thẻ.",
        });
      }

      toast.success("Xóa thành viên khỏi card thành công!");
    } catch (err) {
      console.error("Lỗi xóa thành viên khỏi card:", err);
      toast.error(
        `Có lỗi khi xóa thành viên: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading((prev) => ({ ...prev, removeMember: false }));
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) {
      toast.error("Bình luận không được để trống!");
      return;
    }

    setLoading((prev) => ({ ...prev, comment: true }));

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

      updateCardState(card._id, { comments: response.data });

      if (socket && socketReady) {
        socket.emit("comment-added", {
          cardId: card._id,
          comment: response.data,
        });
      }

      setComment("");
      toast.success("Thêm bình luận thành công!");
    } catch (err) {
      console.error("Lỗi thêm bình luận:", err);
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

      updateCardState(card._id, { notes: response.data });

      if (socket && socketReady) {
        socket.emit("note-added", {
          cardId: card._id,
          note: response.data,
        });
      }

      setNote("");
      toast.success("Thêm ghi chú thành công!");
    } catch (err) {
      console.error("Lỗi thêm ghi chú:", err);
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

      updateCardState(card._id, { checklists: response.data });

      if (socket && socketReady) {
        socket.emit("checklist-added", {
          cardId: card._id,
          checklist: response.data,
        });
      }

      setChecklistTitle("");
      toast.success("Thêm checklist thành công!");
    } catch (err) {
      console.error("Lỗi thêm checklist:", err);
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

      if (socket && socketReady) {
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
      console.error("Lỗi thêm item checklist:", err);
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

      if (socket && socketReady) {
        socket.emit("checklist-item-toggled", {
          cardId: card._id,
          checklistIndex,
          itemIndex,
          completed: newCompleted,
        });
      }

      toast.success("Cập nhật trạng thái item checklist thành công!");
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái item checklist:", err);
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

  useEffect(() => {
    if (!socket || !socketReady) return;

    // Tham gia phòng boardId
    socket.emit("join-board", { boardId: card.board });
    console.log("CardDetails: Joined board room:", card.board);

    // Xử lý khi thẻ bị xóa
    const handleCardDeleted = ({ listId, cardId }) => {
      if (cardId === card._id) {
        console.log("CardDetails: Received card-deleted:", { listId, cardId });
        setCards((prevCards) => prevCards.filter((c) => c._id !== cardId));
        setColumns((prevColumns) =>
          prevColumns.map((col) =>
            col._id === listId
              ? { ...col, cards: col.cards.filter((c) => c._id !== cardId) }
              : col
          )
        );
        setExpanded(false); // Đóng chi tiết thẻ
        toast.info("Thẻ đã được xóa.");
      }
    };

    // Xử lý khi thẻ được di chuyển
    const handleCardMoved = ({
      card: movedCard,
      oldListId,
      newListId,
      newPosition,
    }) => {
      if (movedCard._id === card._id) {
        console.log("CardDetails: Received card-moved:", {
          movedCard,
          oldListId,
          newListId,
          newPosition,
        });
        setColumns((prevColumns) => {
          let updatedColumns = [...prevColumns];
          updatedColumns = updatedColumns.map((col) =>
            col._id === oldListId
              ? {
                  ...col,
                  cards: col.cards.filter((c) => c._id !== movedCard._id),
                }
              : col
          );
          updatedColumns = updatedColumns.map((col) =>
            col._id === newListId
              ? {
                  ...col,
                  cards: [
                    ...col.cards.slice(0, newPosition),
                    movedCard,
                    ...col.cards.slice(newPosition),
                  ],
                }
              : col
          );
          return updatedColumns;
        });
        toast.info("Thẻ đã được di chuyển.");
      }
    };

    // Xử lý khi thẻ được cập nhật
    const handleCardUpdated = ({ cardId, card: updatedCard }) => {
      if (cardId === card._id) {
        console.log("CardDetails: Received card-updated:", {
          cardId,
          updatedCard,
        });
        updateCardState(cardId, updatedCard);
        toast.info("Thẻ đã được cập nhật.");
      }
    };

    // Xử lý khi trạng thái hoàn thành thay đổi
    const handleCardCompletionToggled = ({ cardId, completed }) => {
      if (cardId === card._id) {
        console.log("CardDetails: Received card-completion-toggled:", {
          cardId,
          completed,
        });
        updateCardState(cardId, { completed });
        toast.info(
          `Thẻ đã được ${completed ? "đánh dấu hoàn thành" : "bỏ hoàn thành"}.`
        );
      }
    };

    // Xử lý khi checklist được cập nhật
    const handleChecklistUpdated = ({ cardId, checklistIndex, title }) => {
      if (cardId === card._id) {
        console.log("CardDetails: Received checklist-updated:", {
          cardId,
          checklistIndex,
          title,
        });
        const currentChecklists = JSON.parse(
          JSON.stringify(card.checklists || [])
        );
        if (currentChecklists[checklistIndex]) {
          currentChecklists[checklistIndex].title = title;
          updateCardState(cardId, { checklists: currentChecklists });
          toast.info("Checklist đã được cập nhật.");
        }
      }
    };

    // Xử lý khi checklist bị xóa
    const handleChecklistDeleted = ({ cardId, checklistIndex }) => {
      if (cardId === card._id) {
        console.log("CardDetails: Received checklist-deleted:", {
          cardId,
          checklistIndex,
        });
        const currentChecklists = JSON.parse(
          JSON.stringify(card.checklists || [])
        );
        currentChecklists.splice(checklistIndex, 1);
        updateCardState(cardId, { checklists: currentChecklists });
        toast.info("Checklist đã được xóa.");
      }
    };

    // Xử lý khi item checklist được cập nhật
    const handleChecklistItemUpdated = ({
      cardId,
      checklistIndex,
      itemIndex,
      text,
    }) => {
      if (cardId === card._id) {
        console.log("CardDetails: Received checklist-item-updated:", {
          cardId,
          checklistIndex,
          itemIndex,
          text,
        });
        const currentChecklists = JSON.parse(
          JSON.stringify(card.checklists || [])
        );
        if (currentChecklists[checklistIndex]?.items[itemIndex]) {
          currentChecklists[checklistIndex].items[itemIndex].text = text;
          updateCardState(cardId, { checklists: currentChecklists });
          toast.info("Item checklist đã được cập nhật.");
        }
      }
    };

    // Xử lý khi item checklist bị xóa
    const handleChecklistItemDeleted = ({
      cardId,
      checklistIndex,
      itemIndex,
    }) => {
      if (cardId === card._id) {
        console.log("CardDetails: Received checklist-item-deleted:", {
          cardId,
          checklistIndex,
          itemIndex,
        });
        const currentChecklists = JSON.parse(
          JSON.stringify(card.checklists || [])
        );
        if (currentChecklists[checklistIndex]?.items) {
          currentChecklists[checklistIndex].items.splice(itemIndex, 1);
          updateCardState(cardId, { checklists: currentChecklists });
          toast.info("Item checklist đã được xóa.");
        }
      }
    };

    // Xử lý khi thành viên được thêm vào thẻ
    const handleMemberAdded = ({ cardId, member }) => {
      if (cardId === card._id) {
        console.log("CardDetails: Received member-added:", { cardId, member });
        updateCardState(cardId, {
          members: [...(card.members || []), member],
        });
        toast.info("Thành viên đã được thêm vào thẻ.");
      }
    };

    // Xử lý khi thành viên bị xóa khỏi thẻ
    const handleMemberRemoved = ({ cardId, memberId }) => {
      if (cardId === card._id) {
        console.log("CardDetails: Received member-removed-from-card:", {
          cardId,
          memberId,
        });
        updateCardState(cardId, {
          members: (card.members || []).filter((m) => m._id !== memberId),
        });
        toast.info("Thành viên đã được xóa khỏi thẻ.");
      }
    };

    // Xử lý khi thành viên bị vô hiệu hóa
    const handleMemberDeactivated = ({ boardId, memberId }) => {
      console.log("CardDetails: Received member-deactivated:", {
        boardId,
        memberId,
      });
      setLocalBoardMembers((prev) =>
        prev.map((m) =>
          (m.user?._id || m._id) === memberId ? { ...m, isActive: false } : m
        )
      );
      toast.info("Thành viên đã bị vô hiệu hóa trong bảng.");
    };

    // Xử lý khi bình luận được thêm
    const handleCommentAdded = ({ cardId, comment }) => {
      if (cardId === card._id) {
        console.log("CardDetails: Received comment-added:", {
          cardId,
          comment,
        });
        updateCardState(cardId, {
          comments: [...(card.comments || []), comment],
        });
        toast.info("Bình luận mới đã được thêm.");
      }
    };

    // Xử lý khi ghi chú được thêm
    const handleNoteAdded = ({ cardId, note }) => {
      if (cardId === card._id) {
        console.log("CardDetails: Received note-added:", { cardId, note });
        updateCardState(cardId, {
          notes: [...(card.notes || []), note],
        });
        toast.info("Ghi chú mới đã được thêm.");
      }
    };

    // Xử lý khi checklist được thêm
    const handleChecklistAdded = ({ cardId, checklist }) => {
      if (cardId === card._id) {
        console.log("CardDetails: Received checklist-added:", {
          cardId,
          checklist,
        });
        updateCardState(cardId, {
          checklists: [...(card.checklists || []), checklist],
        });
        toast.info("Checklist mới đã được thêm.");
      }
    };

    // Xử lý khi item checklist được thêm
    const handleChecklistItemAdded = ({
      cardId,
      checklistIndex,
      checklist,
    }) => {
      if (cardId === card._id) {
        console.log("CardDetails: Received checklist-item-added:", {
          cardId,
          checklistIndex,
          checklist,
        });
        const currentChecklists = JSON.parse(
          JSON.stringify(card.checklists || [])
        );
        currentChecklists[checklistIndex] = checklist;
        updateCardState(cardId, { checklists: currentChecklists });
        toast.info("Item checklist mới đã được thêm.");
      }
    };

    // Xử lý khi trạng thái item checklist thay đổi
    const handleChecklistItemToggled = ({
      cardId,
      checklistIndex,
      itemIndex,
      completed,
    }) => {
      if (cardId === card._id) {
        console.log("CardDetails: Received checklist-item-toggled:", {
          cardId,
          checklistIndex,
          itemIndex,
          completed,
        });
        const currentChecklists = JSON.parse(
          JSON.stringify(card.checklists || [])
        );
        if (currentChecklists[checklistIndex]?.items[itemIndex]) {
          currentChecklists[checklistIndex].items[itemIndex].completed =
            completed;
          updateCardState(cardId, { checklists: currentChecklists });
          toast.info("Trạng thái item checklist đã được cập nhật.");
        }
      }
    };

    socket.on("card-deleted", handleCardDeleted);
    socket.on("card-moved", handleCardMoved);
    socket.on("card-updated", handleCardUpdated);
    socket.on("card-completion-toggled", handleCardCompletionToggled);
    socket.on("checklist-updated", handleChecklistUpdated);
    socket.on("checklist-deleted", handleChecklistDeleted);
    socket.on("checklist-item-updated", handleChecklistItemUpdated);
    socket.on("checklist-item-deleted", handleChecklistItemDeleted);
    socket.on("member-added", handleMemberAdded);
    socket.on("member-removed-from-card", handleMemberRemoved);
    socket.on("member-deactivated", handleMemberDeactivated);
    socket.on("comment-added", handleCommentAdded);
    socket.on("note-added", handleNoteAdded);
    socket.on("checklist-added", handleChecklistAdded);
    socket.on("checklist-item-added", handleChecklistItemAdded);
    socket.on("checklist-item-toggled", handleChecklistItemToggled);

    return () => {
      socket.emit("leave-board", { boardId: card.board });
      console.log("CardDetails: Left board room:", card.board);
      socket.off("card-deleted", handleCardDeleted);
      socket.off("card-moved", handleCardMoved);
      socket.off("card-updated", handleCardUpdated);
      socket.off("card-completion-toggled", handleCardCompletionToggled);
      socket.off("checklist-updated", handleChecklistUpdated);
      socket.off("checklist-deleted", handleChecklistDeleted);
      socket.off("checklist-item-updated", handleChecklistItemUpdated);
      socket.off("checklist-item-deleted", handleChecklistItemDeleted);
      socket.off("member-added", handleMemberAdded);
      socket.off("member-removed-from-card", handleMemberRemoved);
      socket.off("member-deactivated", handleMemberDeactivated);
      socket.off("comment-added", handleCommentAdded);
      socket.off("note-added", handleNoteAdded);
      socket.off("checklist-added", handleChecklistAdded);
      socket.off("checklist-item-added", handleChecklistItemAdded);
      socket.off("checklist-item-toggled", handleChecklistItemToggled);
    };
  }, [
    socket,
    socketReady,
    card._id,
    card.board,
    card.members,
    card.checklists,
    card.comments,
    card.notes,
    updateCardState,
    setCards,
    setColumns,
    setExpanded,
  ]);

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
          boardMembers={localBoardMembers}
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
          handleEditChecklist={handleEditChecklist}
          handleDeleteChecklist={handleDeleteChecklist}
          handleEditChecklistItem={handleEditChecklistItem}
          handleDeleteChecklistItem={handleDeleteChecklistItem}
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
          boardMembers={localBoardMembers}
        />
      </Box>
    </Collapse>
  );
}

export default CardDetails;
