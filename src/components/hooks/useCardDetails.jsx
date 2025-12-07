import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { toast } from "react-toastify";
import { normalizeUser, normalizeChecklists, normalizeComments, normalizeNotes } from "../utils/normalize";
import {
  fetchCard,
  fetchCurrentUser,
  checkBoardOwner,
  addNote,
  hideNote,
  addComment,
  hideComment,
  addChecklist,
  updateChecklist,
  deleteChecklist,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  toggleChecklistItem,
  removeMember,
} from "../services/cardService";
import { SocketContext } from '../../context/SocketContext';

export const useCardDetails = (card, setCards, setColumns, boardMembers) => {
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
  const [pendingNotifications, setPendingNotifications] = useState([]);


  const normalizedBoardMembers = useMemo(() => {
    if (!Array.isArray(boardMembers)) {
      console.warn('boardMembers không phải mảng:', boardMembers);
      return [];
    }

    const uniqueMembers = boardMembers.reduce((acc, member) => {
      if (!member || typeof member !== 'object') {
        return acc;
      }

      const memberId = member.user?._id || member._id;
      if (!memberId || typeof memberId !== 'string') {
        return acc;
      }

      const normalizedMember = {
        ...member,
        user: normalizeUser(member.user || member),
        isActive: member.isActive ?? true,
      };

      const existing = acc.find((m) => (m.user?._id || m._id) === memberId);
      if (!existing) {
        acc.push(normalizedMember);
      } else if (member.isActive === false) {
        acc = acc.filter((m) => (m.user?._id || m._id) !== memberId);
        acc.push(normalizedMember);
      }

      return acc;
    }, []);

    return uniqueMembers;
  }, [boardMembers]);


  useEffect(() => {
    setLocalBoardMembers(normalizedBoardMembers);
  }, [normalizedBoardMembers]);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      setLoading((prev) => ({ ...prev, user: true }));
      try {
        const user = await fetchCurrentUser();
        setCurrentUserId(user._id || user.id);
      } catch (err) {
        console.error("Lỗi fetch user:", err.response?.data || err.message);
      } finally {
        setLoading((prev) => ({ ...prev, user: false }));
      }
    };
    fetchUser();
  }, []);

  // Kiểm tra owner board
  useEffect(() => {
    if (!card.board || !currentUserId) return;

    const checkOwner = async () => {
      try {
        const owner = await checkBoardOwner(card.board);
        setIsBoardOwner(currentUserId === owner._id.toString());
      } catch (err) {
        console.error("Lỗi check owner:", err.response?.data || err.message);
      }
    };
    checkOwner();
  }, [card.board, currentUserId]);

  // Fetch card data
  useEffect(() => {
    if (card._id) {
      refreshCard();
    }
  }, [card._id]);

  const updateCardState = useCallback(
    (cardId, updatedFields) => {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          cards: col.cards.map((c) =>
            c._id === cardId
              ? {
                ...c,
                ...updatedFields,
                members: updatedFields.members?.map(normalizeUser) || c.members,
                // comments: normalizeComments(updatedFields.comments ?? c.comments),
                // notes: normalizeNotes(updatedFields.notes ?? c.notes),
                checklists: normalizeChecklists(updatedFields.checklists ?? c.checklists),
              }
              : c
          ),
        }))
      );
    },
    [setColumns]
  );

  // Refresh card
  const refreshCard = useCallback(async () => {
    try {
      const latestCard = await fetchCard(card._id);
      updateCardState(card._id, {
        ...latestCard,
        checklists: normalizeChecklists(latestCard.checklists || []),
        members: (latestCard.members || []).map(normalizeUser),
        comments: normalizeComments(latestCard.comments || []),
        notes: normalizeNotes(latestCard.notes || []),
      });
    } catch (err) {
      console.error("Lỗi refresh card:", err.response?.data || err.message);
      toast.error("Không thể refresh card!");
    }
  }, [card._id, updateCardState]);


  const boardMembersMap = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(normalizedBoardMembers)) return map;

    normalizedBoardMembers.forEach((m) => {
      const mId = (m.user?._id || m._id)?.toString();
      if (mId) {
        map.set(mId, m.isActive ?? false);
      }
    });

    return map;
  }, [normalizedBoardMembers]);


  const isMemberInBoard = useCallback(
    (memberId) => {
      if (
        !memberId ||
        typeof memberId !== 'string' ||
        memberId === 'unknown-user' ||
        boardMembersMap.size === 0
      ) {
        return false;
      }

      const memberIdStr = memberId.toString();
      return boardMembersMap.get(memberIdStr) ?? false;
    },
    [boardMembersMap]
  );


  const handleAddNote = useCallback(async () => {
    if (!note.trim() || !currentUserId || !isMemberInBoard(currentUserId)) {
      toast.error("Không đủ quyền hoặc nội dung ghi chú trống!");
      return;
    }
    setLoading((prev) => ({ ...prev, note: true }));
    try {
      const newNote = await addNote(card._id, note);
      updateCardState(card._id, {
        notes: normalizeNotes([...(card.notes || []), newNote]),
      });
      setNote("");
      if (socket && socketReady) {
        socket.emit("note-added", {
          cardId: card._id,
          note: newNote,
          actorId: currentUserId,
        });
      }
      toast.success("Thêm ghi chú thành công!");
    } catch (err) {
      console.error("Error in handleAddNote:", err.response?.data || err.message);
      toast.error("Lỗi khi thêm ghi chú!");
    } finally {
      setLoading((prev) => ({ ...prev, note: false }));
      await refreshCard();
    }
  }, [note, currentUserId, isMemberInBoard, card._id, card.notes, updateCardState, refreshCard, socket, socketReady]);

  const handleHideNote = useCallback(async (noteId) => {
    if (!currentUserId || !isMemberInBoard(currentUserId)) {
      toast.error("Không đủ quyền để ẩn ghi chú!");
      return;
    }
    setLoading((prev) => ({ ...prev, note: true }));
    try {
      await hideNote(card._id, noteId);
      await refreshCard();
      toast.success("Ẩn ghi chú thành công!");
    } catch (err) {
      console.error("Error in handleHideNote:", err.response?.data || err.message);
      toast.error("Lỗi khi ẩn ghi chú!");
    } finally {
      setLoading((prev) => ({ ...prev, note: false }));
    }
  }, [currentUserId, isMemberInBoard, card._id, refreshCard]);

  const handleAddComment = useCallback(async () => {
    if (!comment.trim() || !currentUserId || !isMemberInBoard(currentUserId)) {
      toast.error("Không đủ quyền hoặc nội dung bình luận trống!");
      return;
    }
    setLoading((prev) => ({ ...prev, comment: true }));
    try {
      const newComment = await addComment(card._id, comment);
      updateCardState(card._id, {
        comments: normalizeComments([...(card.comments || []), newComment]),
      });
      setComment("");
      if (socket && socketReady) {
        socket.emit("comment-added", {
          cardId: card._id,
          comment: newComment,
          actorId: currentUserId,
        });
      }
      toast.success("Thêm bình luận thành công!");
    } catch (err) {
      console.error("Error in handleAddComment:", err.response?.data || err.message);
      toast.error("Lỗi khi thêm bình luận!");
    } finally {
      setLoading((prev) => ({ ...prev, comment: false }));
      await refreshCard();
    }
  }, [comment, currentUserId, isMemberInBoard, card._id, card.comments, updateCardState, refreshCard, socket, socketReady]);

  const handleHideComment = useCallback(async (commentId) => {
    if (!currentUserId || !isMemberInBoard(currentUserId)) {
      toast.error("Không đủ quyền để ẩn bình luận!");
      return;
    }
    setLoading((prev) => ({ ...prev, comment: true }));
    try {
      await hideComment(card._id, commentId);
      await refreshCard();
      toast.success("Ẩn bình luận thành công!");
    } catch (err) {
      console.error("Error in handleHideComment:", err.response?.data || err.message);
      toast.error("Lỗi khi ẩn bình luận!");
    } finally {
      setLoading((prev) => ({ ...prev, comment: false }));
    }
  }, [currentUserId, isMemberInBoard, card._id, refreshCard]);

  const handleAddChecklist = useCallback(async () => {
    if (!checklistTitle.trim() || !currentUserId || !isMemberInBoard(currentUserId)) {
      toast.error("Không đủ quyền hoặc tiêu đề checklist trống!");
      return;
    }
    setLoading((prev) => ({ ...prev, checklist: true }));
    try {
      const checklists = await addChecklist(card._id, checklistTitle);
      updateCardState(card._id, { checklists });
      setChecklistTitle("");
      if (socket && socketReady) {
        socket.emit("checklist-added", {
          cardId: card._id,
          checklist: checklists[checklists.length - 1],
          actorId: currentUserId,
        });
      }
      toast.success("Thêm danh sách kiểm tra thành công!");
    } catch (err) {
      console.error("Error in handleAddChecklist:", err.response?.data || err.message);
      toast.error("Lỗi khi thêm danh sách kiểm tra!");
    } finally {
      setLoading((prev) => ({ ...prev, checklist: false }));
      await refreshCard();
    }
  }, [checklistTitle, currentUserId, isMemberInBoard, card._id, updateCardState, refreshCard, socket, socketReady]);

  const handleUpdateChecklist = useCallback(async (checklistId, title) => {
    if (!title.trim() || !currentUserId || !isMemberInBoard(currentUserId)) {
      toast.error("Không đủ quyền hoặc tiêu đề checklist trống!");
      return;
    }
    setLoading((prev) => ({ ...prev, checklist: true }));
    try {
      const checklists = await updateChecklist(card._id, checklistId, title);
      updateCardState(card._id, { checklists });
      toast.success("Cập nhật danh sách kiểm tra thành công!");
    } catch (err) {
      console.error("Error in handleUpdateChecklist:", err.response?.data || err.message);
      toast.error("Lỗi khi cập nhật danh sách kiểm tra!");
    } finally {
      setLoading((prev) => ({ ...prev, checklist: false }));
      await refreshCard();
    }
  }, [currentUserId, isMemberInBoard, card._id, updateCardState, refreshCard]);

  const handleDeleteChecklist = useCallback(async (checklistId) => {
    if (!currentUserId || !isMemberInBoard(currentUserId)) {
      toast.error("Không đủ quyền để xóa danh sách kiểm tra!");
      return;
    }
    setLoading((prev) => ({ ...prev, checklist: true }));
    try {
      const checklists = await deleteChecklist(card._id, checklistId);
      updateCardState(card._id, { checklists });
      toast.success("Xóa danh sách kiểm tra thành công!");
    } catch (err) {
      console.error("Error in handleDeleteChecklist:", err.response?.data || err.message);
      toast.error("Lỗi khi xóa danh sách kiểm tra!");
    } finally {
      setLoading((prev) => ({ ...prev, checklist: false }));
      await refreshCard();
    }
  }, [currentUserId, isMemberInBoard, card._id, updateCardState, refreshCard]);

  const handleAddChecklistItem = useCallback(async (checklistId, { title, content }) => {
    if (!title?.trim() || !content?.trim()) {
      toast.error("Tiêu đề và nội dung checklist item không được để trống!");
      return;
    }
    if (!currentUserId) {
      toast.error("Không tìm thấy thông tin người dùng!");
      return;
    }
    if (!isMemberInBoard(currentUserId)) {
      toast.error("Bạn không có quyền thêm mục danh sách kiểm tra!");
      return;
    }

    setLoading((prev) => ({ ...prev, checklistItem: true }));
    try {
      const checklists = await addChecklistItem(card._id, checklistId, { title, content });
      updateCardState(card._id, { checklists });
      setChecklistItem("");
      toast.success("Thêm mục danh sách kiểm tra thành công!");
      if (socket && socketReady) {
        const updatedChecklist = checklists.find(cl => cl._id === checklistId);
        const newItem = updatedChecklist?.items[updatedChecklist.items.length - 1];

        socket.emit("checklist-item-added", {
          cardId: card._id,
          checklistId,
          item: newItem,
          actorId: currentUserId,
        });
      }
    } catch (err) {
      console.error("Error in handleAddChecklistItem:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Lỗi khi thêm mục danh sách kiểm tra!");
    } finally {
      setLoading((prev) => ({ ...prev, checklistItem: false }));
      await refreshCard();
    }
  }, [currentUserId, isMemberInBoard, card._id, updateCardState, refreshCard, socket, socketReady]);

  const handleUpdateChecklistItem = useCallback(async (checklistId, itemId, { title, content }) => {
    if (!title.trim() || !content.trim() || !currentUserId || !isMemberInBoard(currentUserId)) {
      toast.error("Không đủ quyền hoặc tiêu đề/nội dung checklist item trống!");
      return;
    }
    setLoading((prev) => ({ ...prev, checklistItem: true }));
    try {
      const checklists = await updateChecklistItem(card._id, checklistId, itemId, { title, content });
      updateCardState(card._id, { checklists });
      toast.success("Cập nhật mục danh sách kiểm tra thành công!");
    } catch (err) {
      console.error("Error in handleUpdateChecklistItem:", err.response?.data || err.message);
      toast.error("Lỗi khi cập nhật mục danh sách kiểm tra!");
    } finally {
      setLoading((prev) => ({ ...prev, checklistItem: false }));
      await refreshCard();
    }
  }, [currentUserId, isMemberInBoard, card._id, updateCardState, refreshCard]);

  const handleDeleteChecklistItem = useCallback(async (checklistId, itemId) => {
    if (!currentUserId || !isMemberInBoard(currentUserId)) {
      toast.error("Không đủ quyền để xóa mục danh sách kiểm tra!");
      return;
    }
    setLoading((prev) => ({ ...prev, checklistItem: true }));
    try {
      const checklists = await deleteChecklistItem(card._id, checklistId, itemId);
      updateCardState(card._id, { checklists });
      toast.success("Xóa mục danh sách kiểm tra thành công!");
    } catch (err) {
      console.error("Error in handleDeleteChecklistItem:", err.response?.data || err.message);
      toast.error("Lỗi khi xóa mục danh sách kiểm tra!");
    } finally {
      setLoading((prev) => ({ ...prev, checklistItem: false }));
      await refreshCard();
    }
  }, [currentUserId, isMemberInBoard, card._id, updateCardState, refreshCard]);

  const handleToggleChecklistItem = useCallback(async (checklistId, itemId, completed) => {
    if (!currentUserId || !isMemberInBoard(currentUserId)) {
      toast.error("Không đủ quyền để thay đổi trạng thái mục danh sách kiểm tra!");
      return;
    }
    setLoading((prev) => ({ ...prev, checklistToggle: true }));
    try {
      const checklists = await toggleChecklistItem(card._id, checklistId, itemId, completed);
      updateCardState(card._id, { checklists });
      toast.success(`Mục danh sách kiểm tra đã được ${completed ? "hoàn thành" : "bỏ hoàn thành"}!`);
      if (socket && socketReady) {
        socket.emit("checklist-item-toggled", {
          cardId: card._id,
          checklistId,
          itemId,
          completed,
          actorId: currentUserId,
        });
      }
    } catch (err) {
      console.error("Error in handleToggleChecklistItem:", err.response?.data || err.message);
      toast.error("Lỗi khi thay đổi trạng thái mục danh sách kiểm tra!");
    } finally {
      setLoading((prev) => ({ ...prev, checklistToggle: false }));
      await refreshCard();
    }
  }, [currentUserId, isMemberInBoard, card._id, updateCardState, refreshCard, socket, socketReady]);

  const handleRemoveMember = useCallback(async (memberId) => {
    if (!currentUserId || !isMemberInBoard(currentUserId)) {
      toast.error("Không đủ quyền để xóa thành viên!");
      return;
    }
    setLoading((prev) => ({ ...prev, removeMember: true }));
    try {
      const members = await removeMember(card._id, memberId);
      updateCardState(card._id, { members });
      toast.success("Xóa thành viên thành công!");
    } catch (err) {
      console.error("Error in handleRemoveMember:", err.response?.data || err.message);
      toast.error("Lỗi khi xóa thành viên!");
    } finally {
      setLoading((prev) => ({ ...prev, removeMember: false }));
      await refreshCard();
    }
  }, [currentUserId, isMemberInBoard, card._id, updateCardState, refreshCard]);

  const memoizedMembers = useMemo(() => (card.members || []).map(normalizeUser), [card.members]);
  const memoizedBoardMembers = useMemo(
    () => normalizedBoardMembers.map((m) => ({ ...m, user: normalizeUser(m.user) })),
    [normalizedBoardMembers]
  );

  return {
    comment,
    setComment,
    note,
    setNote,
    checklistTitle,
    setChecklistTitle,
    checklistItem,
    setChecklistItem,
    openAddMemberDialog,
    setOpenAddMemberDialog,
    currentUserId,
    isBoardOwner,
    loading,
    setLoading,
    localBoardMembers,
    setLocalBoardMembers,
    pendingNotifications,
    setPendingNotifications,
    updateCardState,
    refreshCard,
    isMemberInBoard,
    handleAddNote,
    handleHideNote,
    handleAddComment,
    handleHideComment,
    handleAddChecklist,
    handleUpdateChecklist,
    handleDeleteChecklist,
    handleAddChecklistItem,
    handleUpdateChecklistItem,
    handleDeleteChecklistItem,
    handleToggleChecklistItem,
    handleRemoveMember,
    memoizedMembers,
    memoizedBoardMembers,
  };
};