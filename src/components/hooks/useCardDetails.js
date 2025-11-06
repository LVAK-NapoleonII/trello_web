import { useState, useEffect, useCallback, useMemo } from "react";
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

export const useCardDetails = (card, setCards, setColumns, boardMembers) => {
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

  // Normalize và unique boardMembers
  useEffect(() => {
    if (!Array.isArray(boardMembers)) {
      console.warn('boardMembers không phải mảng:', boardMembers);
      setLocalBoardMembers([]);
      return;
    }

    const uniqueMembers = boardMembers.reduce((acc, member) => {
      if (!member || typeof member !== 'object') {
        console.warn('Member không hợp lệ:', member);
        return acc;
      }

      const memberId = member.user?._id || member._id;
      if (!memberId || typeof memberId !== 'string') {
        console.warn('Member không có ID hợp lệ:', member);
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

    setLocalBoardMembers(uniqueMembers);
  }, [boardMembers]);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      setLoading((prev) => ({ ...prev, user: true }));
      try {
        const user = await fetchCurrentUser();
        setCurrentUserId(user._id || user.id);
      } catch (err) {
        console.error("Lỗi fetch user trong useCardDetails:", err.response?.data || err.message);
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
        console.error("Lỗi check owner trong useCardDetails:", err.response?.data || err.message);
      }
    };
    checkOwner();
  }, [card.board, currentUserId]);

  // Fetch card data khi card được mount
  useEffect(() => {
    if (card._id) {
      refreshCard();
    }
  }, [card._id]);

  // Cập nhật state card
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
                comments: normalizeComments(updatedFields.comments ?? c.comments),
                notes: normalizeNotes(updatedFields.notes ?? c.notes),
                checklists: normalizeChecklists(updatedFields.checklists ?? c.checklists),
              }
            : c
        ),
      }))
    );
  },
  [setColumns]
);

  // Refresh card từ server
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

  // Kiểm tra member trong board
  const isMemberInBoard = useCallback(
    (memberId) => {
      if (!memberId || typeof memberId !== 'string' || memberId === 'unknown-user' || !Array.isArray(localBoardMembers) || localBoardMembers.length === 0) {
        console.warn('isMemberInBoard: Invalid memberId or empty boardMembers', {
          memberId,
          localBoardMembersLength: localBoardMembers.length,
          isUnknownUser: memberId === 'unknown-user',
        });
        return false;
      }

      const memberIdStr = memberId.toString();
      
      const member = localBoardMembers.find((m) => {
        const mId = (m.user?._id || m._id)?.toString();
        return mId === memberIdStr;
      });

      const isActive = member?.isActive ?? false;

      console.log('isMemberInBoard result:', {
        memberId: memberIdStr,
        isActive,
        member: member ? { id: member.user?._id || member._id, name: member.user?.fullName } : null,
      });

      return isActive;
    },
    [localBoardMembers]
  );

  // Xử lý thêm ghi chú
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
    toast.success("Thêm ghi chú thành công!");
  } catch (err) {
    console.error("Error in handleAddNote:", err.response?.data || err.message);
    toast.error("Lỗi khi thêm ghi chú!");
  } finally {
    setLoading((prev) => ({ ...prev, note: false }));
    await refreshCard();
  }
}, [note, currentUserId, isMemberInBoard, card._id, card.notes, updateCardState, refreshCard]);

  // Xử lý ẩn ghi chú
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

  // Xử lý thêm bình luận
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
    toast.success("Thêm bình luận thành công!");
  } catch (err) {
    console.error("Error in handleAddComment:", err.response?.data || err.message);
    toast.error("Lỗi khi thêm bình luận!");
  } finally {
    setLoading((prev) => ({ ...prev, comment: false }));
    await refreshCard();
  }
}, [comment, currentUserId, isMemberInBoard, card._id, card.comments, updateCardState, refreshCard]);

  // Xử lý ẩn bình luận
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

  // Xử lý thêm danh sách kiểm tra
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
      toast.success("Thêm danh sách kiểm tra thành công!");
    } catch (err) {
      console.error("Error in handleAddChecklist:", err.response?.data || err.message);
      toast.error("Lỗi khi thêm danh sách kiểm tra!");
    } finally {
      setLoading((prev) => ({ ...prev, checklist: false }));
      await refreshCard();
    }
  }, [checklistTitle, currentUserId, isMemberInBoard, card._id, updateCardState, refreshCard]);

  // Xử lý cập nhật danh sách kiểm tra
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

  // Xử lý xóa danh sách kiểm tra
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

  // Xử lý thêm mục danh sách kiểm tra
  const handleAddChecklistItem = useCallback(async (checklistId, { title, content }) => {
    console.log("handleAddChecklistItem inputs:", { checklistId, title, content, currentUserId, isMember: isMemberInBoard(currentUserId) });
    
    if (!title?.trim() || !content?.trim()) {
      console.error("handleAddChecklistItem: Tiêu đề hoặc nội dung checklist item trống hoặc không hợp lệ:", { title, content });
      toast.error("Tiêu đề và nội dung checklist item không được để trống!");
      return;
    }
    if (!currentUserId) {
      console.error("handleAddChecklistItem: currentUserId không hợp lệ:", currentUserId);
      toast.error("Không tìm thấy thông tin người dùng!");
      return;
    }
    if (!isMemberInBoard(currentUserId)) {
      console.error("handleAddChecklistItem: Người dùng không có quyền:", currentUserId);
      toast.error("Bạn không có quyền thêm mục danh sách kiểm tra!");
      return;
    }
    
    setLoading((prev) => ({ ...prev, checklistItem: true }));
    try {
      const checklists = await addChecklistItem(card._id, checklistId, { title, content });
      updateCardState(card._id, { checklists });
      setChecklistItem("");
      toast.success("Thêm mục danh sách kiểm tra thành công!");
    } catch (err) {
      console.error("Error in handleAddChecklistItem:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Lỗi khi thêm mục danh sách kiểm tra!");
    } finally {
      setLoading((prev) => ({ ...prev, checklistItem: false }));
      await refreshCard();
    }
  }, [currentUserId, isMemberInBoard, card._id, updateCardState, refreshCard]);

  // Xử lý cập nhật mục danh sách kiểm tra
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

  // Xử lý xóa mục danh sách kiểm tra
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

  // Xử lý thay đổi trạng thái mục danh sách kiểm tra
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
    } catch (err) {
      console.error("Error in handleToggleChecklistItem:", err.response?.data || err.message);
      toast.error("Lỗi khi thay đổi trạng thái mục danh sách kiểm tra!");
    } finally {
      setLoading((prev) => ({ ...prev, checklistToggle: false }));
      await refreshCard();
    }
  }, [currentUserId, isMemberInBoard, card._id, updateCardState, refreshCard]);

  // Xử lý xóa thành viên
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
    () => localBoardMembers.map((m) => ({ ...m, user: normalizeUser(m.user) })),
    [localBoardMembers]
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