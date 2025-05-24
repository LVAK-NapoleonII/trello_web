import { useState, useContext, useEffect, useCallback, useMemo } from "react";
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

// Hàm chuẩn hóa checklists
const normalizeChecklists = (checklists) => {
  console.log("normalizeChecklists input:", checklists);
  let checklistsArray = checklists;

  if (checklists && !Array.isArray(checklists) && checklists.checklists) {
    console.warn("Checklists là đối tượng, lấy thuộc tính checklists:", checklists);
    checklistsArray = checklists.checklists;
  }

  if (!Array.isArray(checklistsArray)) {
    console.warn("Checklists không phải là mảng sau khi xử lý:", checklistsArray);
    return [];
  }

  // Lọc bỏ các checklist có isDeleted: true
  return checklistsArray
    .filter(checklist => !checklist.isDeleted)
    .map((checklist) => ({
      _id: checklist._id || new Date().toISOString(),
      title: checklist.title || "Untitled Checklist",
      items: Array.isArray(checklist.items)
        ? checklist.items
          .filter(item => !item.isDeleted) // Lọc bỏ các item có isDeleted: true
          .map((item) => ({
            _id: item._id || new Date().toISOString(),
            text: item.text || "",
            completed: !!item.completed,
            createdAt: item.createdAt || new Date().toISOString(),
          }))
        : [],
    }));
};
// Hàm chuẩn hóa user
const normalizeUser = (user) => {
  console.log("Normalizing user:", user);
  if (!user || (!user._id && !user.id)) {
    console.error("Invalid user data, missing _id:", user);
    return {
      _id: null,
      fullName: "Unknown User",
      avatar: `https://api.dicebear.com/9.x/initials/svg?seed=Unknown`,
      email: "",
    };
  }
  const normalized = {
    _id: user._id || user.id,
    fullName: user.fullName || user.email || "Unknown User",
    avatar:
      user.avatar ||
      `https://api.dicebear.com/9.x/initials/svg?seed=${user.fullName || user.email || "Unknown"
      }`,
    email: user.email || "",
  };
  console.log("Normalized user:", normalized);
  return normalized;
};

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
  const [pendingNotifications, setPendingNotifications] = useState([]);

  // Hiển thị thông báo hợp nhất với debounce
  const showConsolidatedNotification = useCallback(() => {
    if (pendingNotifications.length === 0) return;
    const uniqueMessages = [...new Set(pendingNotifications)];
    const message = uniqueMessages.join(" ");
    toast.info(message, { toastId: "consolidated-notification" });
    setPendingNotifications([]);
  }, [pendingNotifications]);

  useEffect(() => {
    if (pendingNotifications.length > 0) {
      const timer = setTimeout(showConsolidatedNotification, 1000);
      return () => clearTimeout(timer);
    }
  }, [pendingNotifications, showConsolidatedNotification]);

  // Xử lý boardMembers
  useEffect(() => {
    console.log("Received boardMembers:", boardMembers);
    if (boardMembers && Array.isArray(boardMembers)) {
      const uniqueBoardMembers = boardMembers.reduce((acc, member) => {
        const memberId = member.user?._id || member._id;
        if (!memberId) {
          console.warn("Invalid member, missing _id:", member);
          return acc;
        }
        const existingMember = acc.find(
          (m) => (m.user?._id || m._id)?.toString() === memberId.toString()
        );
        if (!existingMember) {
          acc.push({
            ...member,
            user: normalizeUser(member.user || member),
            isActive: member.isActive !== undefined ? member.isActive : true,
          });
        } else if (member.isActive === false) {
          acc = acc.filter(
            (m) => (m.user?._id || m._id)?.toString() !== memberId.toString()
          );
          acc.push({
            ...member,
            user: normalizeUser(member.user || member),
            isActive: false,
          });
        }
        return acc;
      }, []);
      console.log("Normalized boardMembers:", uniqueBoardMembers);
      setLocalBoardMembers(uniqueBoardMembers);
    } else {
      console.warn("boardMembers is invalid or empty:", boardMembers);
      setLocalBoardMembers([]);
    }
  }, [boardMembers]);

  // Lấy thông tin người dùng hiện tại
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setLoading((prev) => ({ ...prev, user: true }));
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Không tìm thấy token!");
        }
        const response = await axios.get(
          "http://localhost:5000/api/auth/profile",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const userId = response.data.user._id || response.data.user.id;
        if (!userId) {
          throw new Error("Không tìm thấy user ID trong dữ liệu!");
        }
        setCurrentUserId(userId);
        console.log("Fetched currentUserId:", userId);
      } catch (err) {
        console.error("Lỗi lấy thông tin người dùng:", err);
        toast.error("Không thể lấy thông tin người dùng hiện tại!");
        // Có thể chuyển hướng đến trang đăng nhập
        // window.location.href = "/login";
      } finally {
        setLoading((prev) => ({ ...prev, user: false }));
      }
    };
    fetchCurrentUser();
  }, []);

  // Kiểm tra quyền chủ phòng
  useEffect(() => {
    const checkBoardOwner = async () => {
      if (!card.board || !currentUserId) {
        console.warn("Missing card.board or currentUserId", {
          board: card.board,
          currentUserId,
        });
        return;
      }
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5000/api/boards/${card.board}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const board = response.data;
        const ownerId = board.owner?._id
          ? board.owner._id.toString()
          : board.owner.toString();
        setIsBoardOwner(currentUserId === ownerId);
        console.log("Checked board owner:", {
          isBoardOwner: currentUserId === ownerId,
        });
      } catch (err) {
        console.error("Lỗi kiểm tra chủ phòng:", err);
        toast.error("Không thể xác minh quyền chủ phòng!");
      }
    };
    checkBoardOwner();
  }, [card.board, currentUserId]);

  // Cập nhật trạng thái thẻ
  const updateCardState = useCallback(
    (cardId, updatedFields) => {
      setCards((prevCards) => {
        const newCards = prevCards.map((c) =>
          c._id === cardId
            ? {
              ...c,
              ...updatedFields,
              members: updatedFields.members
                ? updatedFields.members.map(normalizeUser)
                : c.members,
              comments: updatedFields.comments
                ? updatedFields.comments.map((comment) => ({
                  ...comment,
                  user: normalizeUser(comment.user),
                }))
                : c.comments,
              notes: updatedFields.notes
                ? updatedFields.notes.map((note) => ({
                  ...note,
                  createdBy: normalizeUser(note.createdBy),
                }))
                : c.notes,
              checklists: normalizeChecklists(
                updatedFields.checklists !== undefined
                  ? updatedFields.checklists
                  : c.checklists
              ),
            }
            : c
        );
        console.log("Updated cards:", newCards);
        return newCards;
      });
      setColumns((prevColumns) => {
        const newColumns = prevColumns.map((col) => ({
          ...col,
          cards: col.cards.map((c) =>
            c._id === cardId
              ? {
                ...c,
                ...updatedFields,
                members: updatedFields.members
                  ? updatedFields.members.map(normalizeUser)
                  : c.members,
                comments: updatedFields.comments
                  ? updatedFields.comments.map((comment) => ({
                    ...comment,
                    user: normalizeUser(comment.user),
                  }))
                  : c.comments,
                notes: updatedFields.notes
                  ? updatedFields.notes.map((note) => ({
                    ...note,
                    createdBy: normalizeUser(note.createdBy),
                  }))
                  : c.notes,
                checklists: normalizeChecklists(
                  updatedFields.checklists !== undefined
                    ? updatedFields.checklists
                    : c.checklists
                ),
              }
              : c
          ),
        }));
        console.log("Updated columns:", newColumns);
        return newColumns;
      });
    },
    [setCards, setColumns]
  );

  // Kiểm tra thành viên trong bảng
  const isMemberInBoard = useCallback(
    (memberId) => {
      if (!memberId || memberId === null) {
        console.warn("isMemberInBoard: Invalid memberId", { memberId });
        return false;
      }
      if (!localBoardMembers?.length) {
        console.warn("isMemberInBoard: localBoardMembers is empty");
        return false;
      }
      const boardMember = localBoardMembers.find((boardMember) => {
        const memberIdFromBoard = boardMember.user?._id || boardMember._id;
        return memberIdFromBoard?.toString() === memberId.toString();
      });
      if (!boardMember) {
        console.log(
          `isMemberInBoard: No matching member found for ${memberId}`
        );
        return false;
      }
      const isActive =
        boardMember.isActive !== undefined ? boardMember.isActive : true;
      console.log(`isMemberInBoard: Member ${memberId}, isActive: ${isActive}`);
      return isActive;
    },
    [localBoardMembers]
  );

  // Thu hồi bình luận
  const handleHideComment = async (commentId) => {
    if (!window.confirm("Bạn có chắc muốn thu hồi bình luận này?")) return;

    setLoading((prev) => ({ ...prev, comment: true }));

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/cards/${card._id}/comments/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateCardState(card._id, {
        comments: card.comments.map((c) =>
          c._id === commentId ? { ...c, isDeleted: true } : c
        ),
      });

      if (socket && socketReady) {
        socket.emit("comment-hidden", {
          cardId: card._id,
          commentId,
          boardId: card.board,
          actorId: currentUserId,
        });
      }

      toast.success("Thu hồi bình luận thành công!");
    } catch (err) {
      console.error("Lỗi thu hồi bình luận:", err);
      toast.error(
        err.response?.status === 403
          ? "Bạn không có quyền thu hồi bình luận!"
          : err.response?.data?.message || "Không thể thu hồi bình luận!"
      );
    } finally {
      setLoading((prev) => ({ ...prev, comment: false }));
    }
  };

  // Thu hồi ghi chú
  const handleHideNote = async (noteId) => {
    if (!window.confirm("Bạn có chắc muốn thu hồi ghi chú này?")) return;

    setLoading((prev) => ({ ...prev, note: true }));

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/cards/${card._id}/notes/${noteId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateCardState(card._id, {
        notes: card.notes.map((n) =>
          n._id === noteId ? { ...n, isDeleted: true } : n
        ),
      });

      if (socket && socketReady) {
        socket.emit("note-hidden", {
          cardId: card._id,
          noteId,
          boardId: card.board,
          actorId: currentUserId,
        });
      }

      toast.success("Thu hồi ghi chú thành công!");
    } catch (err) {
      console.error("Lỗi thu hồi ghi chú:", err);
      toast.error(
        err.response?.status === 403
          ? "Bạn không có quyền thu hồi ghi chú!"
          : err.response?.data?.message || "Không thể thu hồi ghi chú!"
      );
    } finally {
      setLoading((prev) => ({ ...prev, note: false }));
    }
  };

  // Xử lý sự kiện Socket.IO
  useEffect(() => {
    if (!socket || !socketReady || !card.board) {
      console.warn(
        "CardDetails: Socket not available, not ready, or no boardId",
        { socket: !!socket, socketReady, boardId: card.board }
      );
      return;
    }

    socket.emit("join-board", { boardId: card.board });
    console.log("CardDetails: Joined board room:", card.board);

    const socketHandlers = {
      "card-added": ({ listId, card: newCard, actorId }) => {
        if (actorId !== currentUserId) {
          console.log("Received card-added:", { listId, newCard, actorId });
          setCards((prev) => [
            ...prev,
            { ...newCard, members: (newCard.members || []).map(normalizeUser) },
          ]);
          setColumns((prev) =>
            prev.map((col) =>
              col._id === listId
                ? {
                  ...col,
                  cards: [
                    ...col.cards,
                    {
                      ...newCard,
                      checklists: normalizeChecklists(newCard.checklists),
                      members: (newCard.members || []).map(normalizeUser),
                      comments: (newCard.comments || []).map((c) => ({
                        ...c,
                        user: normalizeUser(c.user),
                      })),
                      notes: (newCard.notes || []).map((n) => ({
                        ...n,
                        createdBy: normalizeUser(n.createdBy),
                      })),
                    },
                  ],
                }
                : col
            )
          );
          setPendingNotifications((prev) => [...prev, "Thẻ mới đã được thêm."]);
        }
      },

      "card-hidden": ({ listId, cardId, actorId }) => {
        if (actorId !== currentUserId) {
          console.log("Received card-deleted:", { listId, cardId, actorId });
          setCards((prev) => prev.filter((c) => c._id !== cardId));
          setColumns((prev) =>
            prev.map((col) =>
              col._id === listId
                ? { ...col, cards: col.cards.filter((c) => c._id !== cardId) }
                : col
            )
          );
          if (cardId === card._id) {
            setExpanded(false);
          }
          setPendingNotifications((prev) => [...prev, "Thẻ đã được xóa."]);
        }
      },

      "card-moved": ({
        card: movedCard,
        oldListId,
        newListId,
        newPosition,
        actorId,
      }) => {
        if (movedCard._id === card._id && actorId !== currentUserId) {
          console.log("Received card-moved:", {
            movedCard,
            oldListId,
            newListId,
            newPosition,
            actorId,
          });
          setColumns((prev) => {
            let updatedColumns = [...prev];
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
                    {
                      ...movedCard,
                      checklists: normalizeChecklists(movedCard.checklists),
                      members: (movedCard.members || []).map(normalizeUser),
                      comments: (movedCard.comments || []).map((c) => ({
                        ...c,
                        user: normalizeUser(c.user),
                      })),
                      notes: (movedCard.notes || []).map((n) => ({
                        ...n,
                        createdBy: normalizeUser(n.createdBy),
                      })),
                    },
                    ...col.cards.slice(newPosition),
                  ],
                }
                : col
            );
            return updatedColumns;
          });
          setPendingNotifications((prev) => [
            ...prev,
            "Thẻ đã được di chuyển.",
          ]);
        }
      },

      "card-updated": ({ cardId, card: updatedCard, actorId }) => {
        if (cardId === card._id && actorId !== currentUserId) {
          console.log("Received card-updated:", {
            cardId,
            updatedCard,
            actorId,
          });
          updateCardState(cardId, {
            ...updatedCard,
            checklists: normalizeChecklists(updatedCard.checklists),
            members: (updatedCard.members || []).map(normalizeUser),
            comments: (updatedCard.comments || []).map((c) => ({
              ...c,
              user: normalizeUser(c.user),
            })),
            notes: (updatedCard.notes || []).map((n) => ({
              ...n,
              createdBy: normalizeUser(n.createdBy),
            })),
          });
          setPendingNotifications((prev) => [...prev, "Thẻ đã được cập nhật."]);
        }
      },

      "card-completion-toggled": ({ cardId, completed, actorId }) => {
        if (cardId === card._id && actorId !== currentUserId) {
          console.log("Received card-completion-toggled:", {
            cardId,
            completed,
            actorId,
          });
          updateCardState(cardId, { completed });
          setPendingNotifications((prev) => [
            ...prev,
            `Thẻ đã được ${completed ? "đánh dấu hoàn thành" : "bỏ hoàn thành"
            }.`,
          ]);
        }
      },

      "member-added-to-board": ({ boardId, member, actorId }) => {
        if (boardId === card.board && actorId !== currentUserId) {
          console.log("Received member-added-to-board:", {
            boardId,
            member,
            actorId,
          });
          setLocalBoardMembers((prev) => {
            const exists = prev.some(
              (m) =>
                (m.user?._id || m._id)?.toString() === member._id?.toString()
            );
            if (!exists) {
              const newMembers = [
                ...prev,
                { user: normalizeUser(member), isActive: true },
              ];
              console.log("Updated localBoardMembers:", newMembers);
              return newMembers;
            }
            return prev;
          });
          setBoardMembers((prev) => {
            const exists = prev.some(
              (m) =>
                (m.user?._id || m._id)?.toString() === member._id?.toString()
            );
            if (!exists) {
              const newMembers = [
                ...prev,
                { user: normalizeUser(member), isActive: true },
              ];
              console.log("Updated boardMembers:", newMembers);
              return newMembers;
            }
            return prev;
          });
          setPendingNotifications((prev) => [
            ...prev,
            `Thành viên ${member.fullName || "Unknown"} đã được thêm vào bảng.`,
          ]);
        }
      },

      "member-deactivated": ({ boardId, deactivatedUserId, actorId }) => {
        if (boardId === card.board && actorId !== currentUserId) {
          console.log("Received member-deactivated:", {
            boardId,
            deactivatedUserId,
            actorId,
          });
          setLocalBoardMembers((prev) => {
            const memberExists = prev.some(
              (m) =>
                (m.user?._id || m._id)?.toString() ===
                deactivatedUserId.toString()
            );
            if (memberExists) {
              const updatedMembers = prev.map((m) =>
                (m.user?._id || m._id)?.toString() ===
                  deactivatedUserId.toString()
                  ? { ...m, isActive: false }
                  : m
              );
              console.log("Updated localBoardMembers:", updatedMembers);
              return updatedMembers;
            }
            return prev;
          });
          setBoardMembers((prev) => {
            const memberExists = prev.some(
              (m) =>
                (m.user?._id || m._id)?.toString() ===
                deactivatedUserId.toString()
            );
            if (memberExists) {
              const updatedMembers = prev.map((m) =>
                (m.user?._id || m._id)?.toString() ===
                  deactivatedUserId.toString()
                  ? { ...m, isActive: false }
                  : m
              );
              console.log("Updated boardMembers:", updatedMembers);
              return updatedMembers;
            }
            return prev;
          });
          setPendingNotifications((prev) => [
            ...prev,
            "Thành viên đã bị vô hiệu hóa trong bảng.",
          ]);
        }
      },

      "member-added": ({ cardId, member, actorId }) => {
        if (cardId === card._id && actorId !== currentUserId) {
          console.log("Received member-added:", {
            cardId,
            member,
            actorId,
          });
          updateCardState(cardId, {
            members: [...(card.members || []), normalizeUser(member)],
          });
          setPendingNotifications((prev) => [
            ...prev,
            `Thành viên ${member.fullName || "Unknown"} đã được thêm vào thẻ.`,
          ]);
        }
      },

      "member-removed-from-card": ({ cardId, memberId, actorId }) => {
        if (cardId === card._id && actorId !== currentUserId) {
          console.log("Received member-removed-from-card:", {
            cardId,
            memberId,
            actorId,
          });
          updateCardState(cardId, {
            members: (card.members || []).filter(
              (m) => m._id?.toString() !== memberId.toString()
            ),
          });
          setPendingNotifications((prev) => [
            ...prev,
            "Thành viên đã được xóa khỏi thẻ.",
          ]);
        }
      },

      "comment-added": ({ cardId, comment, actorId }) => {
        if (cardId === card._id && actorId !== currentUserId) {
          console.log("Received comment-added:", { cardId, comment, actorId });
          updateCardState(cardId, {
            comments: [
              ...(card.comments || []),
              {
                ...comment,
                user: normalizeUser(comment.user),
                createdAt: comment.createdAt || new Date().toISOString(),
              },
            ],
          });
          setPendingNotifications((prev) => [
            ...prev,
            "Bình luận mới đã được thêm.",
          ]);
        }
      },

      "comment-hidden": ({ cardId, commentId, actorId }) => {
        if (cardId === card._id && actorId !== currentUserId) {
          console.log("Received comment-hidden:", {
            cardId,
            commentId,
            actorId,
          });
          updateCardState(cardId, {
            comments: card.comments.map((c) =>
              c._id === commentId ? { ...c, isDeleted: true } : c
            ),
          });
          setPendingNotifications((prev) => [
            ...prev,
            "Một bình luận đã được thu hồi.",
          ]);
        }
      },

      "note-added": ({ cardId, note, actorId }) => {
        if (cardId === card._id && actorId !== currentUserId) {
          console.log("Received note-added:", { cardId, note, actorId });
          updateCardState(cardId, {
            notes: [
              ...(card.notes || []),
              {
                ...note,
                createdBy: normalizeUser(note.createdBy),
                createdAt: note.createdAt || new Date().toISOString(),
              },
            ],
          });
          setPendingNotifications((prev) => [
            ...prev,
            "Ghi chú mới đã được thêm.",
          ]);
        }
      },

      "note-hidden": ({ cardId, noteId, actorId }) => {
        if (cardId === card._id && actorId !== currentUserId) {
          console.log("Received note-hidden:", { cardId, noteId, actorId });
          updateCardState(cardId, {
            notes: card.notes.map((n) =>
              n._id === noteId ? { ...n, isDeleted: true } : n
            ),
          });
          setPendingNotifications((prev) => [
            ...prev,
            "Một ghi chú đã được thu hồi.",
          ]);
        }
      },

      "checklist-added": ({ cardId, checklist, actorId }) => {
        if (cardId === card._id && actorId !== currentUserId) {
          console.log("Received checklist-added:", {
            cardId,
            checklist,
            actorId,
          });
          updateCardState(cardId, {
            checklists: [
              ...normalizeChecklists(card.checklists || []),
              normalizeChecklists([checklist])[0],
            ],
          });
          setPendingNotifications((prev) => [
            ...prev,
            "Checklist mới đã được thêm.",
          ]);
        }
      },

      "checklist-item-added": ({
        cardId,
        checklistId,
        item,
        checklist,
        actorId,
      }) => {
        if (cardId === card._id && actorId !== currentUserId) {
          console.log("Received checklist-item-added:", {
            cardId,
            checklistId,
            item,
            checklist,
            actorId,
          });
          updateCardState(cardId, {
            checklists: normalizeChecklists(card.checklists || []).map((cl) =>
              cl._id === checklistId ? normalizeChecklists([checklist])[0] : cl
            ),
          });
          setPendingNotifications((prev) => [
            ...prev,
            "Item checklist mới đã được thêm.",
          ]);
        }
      },

      "checklist-item-toggled": ({
        cardId,
        checklistId,
        itemId,
        completed,
        actorId,
      }) => {
        if (cardId === card._id && actorId !== currentUserId) {
          console.log("Received checklist-item-toggled:", {
            cardId,
            checklistId,
            itemId,
            completed,
            actorId,
          });
          updateCardState(cardId, {
            checklists: normalizeChecklists(card.checklists || []).map((cl) =>
              cl._id === checklistId
                ? {
                  ...cl,
                  items: cl.items.map((item) =>
                    item._id === itemId ? { ...item, completed } : item
                  ),
                }
                : cl
            ),
          });
          setPendingNotifications((prev) => [
            ...prev,
            `Item checklist đã được ${completed ? "đánh dấu hoàn thành" : "bỏ hoàn thành"
            }.`,
          ]);
        }
      },

      "checklist-updated": ({
        cardId,
        checklistId,
        title,
        checklist,
        actorId,
      }) => {
        if (cardId === card._id && actorId !== currentUserId) {
          console.log("Received checklist-updated:", {
            cardId,
            checklistId,
            title,
            checklist,
            actorId,
          });
          updateCardState(cardId, {
            checklists: normalizeChecklists(card.checklists || []).map((cl) =>
              cl._id === checklistId ? normalizeChecklists([checklist])[0] : cl
            ),
          });
          setPendingNotifications((prev) => [
            ...prev,
            "Checklist đã được cập nhật.",
          ]);
        }
      },

      "checklist-deleted": ({ cardId, checklistId, actorId }) => {
        if (cardId === card._id && actorId !== currentUserId) {
          console.log("Received checklist-deleted:", {
            cardId,
            checklistId,
            actorId,
          });
          updateCardState(cardId, {
            checklists: normalizeChecklists(card.checklists || []).filter(
              (cl) => cl._id !== checklistId
            ),
          });
          setPendingNotifications((prev) => [
            ...prev,
            "Checklist đã được xóa.",
          ]);
        }
      },

      "checklist-item-updated": ({
        cardId,
        checklistId,
        itemId,
        item,
        checklist,
        actorId,
      }) => {
        if (cardId === card._id && actorId !== currentUserId) {
          console.log("Received checklist-item-updated:", {
            cardId,
            checklistId,
            itemId,
            item,
            checklist,
            actorId,
          });
          updateCardState(cardId, {
            checklists: normalizeChecklists(card.checklists || []).map((cl) =>
              cl._id === checklistId ? normalizeChecklists([checklist])[0] : cl
            ),
          });
          setPendingNotifications((prev) => [
            ...prev,
            "Item checklist đã được cập nhật.",
          ]);
        }
      },

      "checklist-item-deleted": ({ cardId, checklistId, itemId, actorId }) => {
        if (cardId === card._id && actorId !== currentUserId) {
          console.log("Received checklist-item-deleted:", {
            cardId,
            checklistId,
            itemId,
            actorId,
          });
          updateCardState(cardId, {
            checklists: normalizeChecklists(card.checklists || []).map((cl) =>
              cl._id === checklistId
                ? {
                  ...cl,
                  items: cl.items.filter((item) => item._id !== itemId),
                }
                : cl
            ),
          });
          setPendingNotifications((prev) => [
            ...prev,
            "Item checklist đã được xóa.",
          ]);
        }
      },
    };

    Object.entries(socketHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      socket.emit("leave-board", { boardId: card.board });
      console.log("CardDetails: Left board room:", card.board);
      Object.keys(socketHandlers).forEach((event) => {
        socket.off(event, socketHandlers[event]);
      });
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
    currentUserId,
  ]);

  // Thêm bình luận
  const handleAddComment = async () => {
    if (!comment.trim()) {
      toast.error("Bình luận không được để trống!");
      return;
    }
    if (!currentUserId) {
      toast.error("Không tìm thấy thông tin người dùng hiện tại!");
      return;
    }
    if (!isMemberInBoard(currentUserId)) {
      toast.error("Bạn không có quyền thêm bình luận trong bảng này!");
      return;
    }

    setLoading((prev) => ({ ...prev, comment: true }));

    const tempComment = {
      _id: new Date().toISOString(),
      text: comment,
      user: {
        _id: currentUserId,
        fullName: "Bạn",
        avatar: "",
      },
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };
    updateCardState(card._id, {
      comments: [...(card.comments || []), tempComment],
    });

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/cards/${card._id}/comments`,
        { text: comment, cardId: card._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateCardState(card._id, { comments: response.data });

      if (socket && socketReady && response.data.length > 0) {
        const latestComment = response.data[response.data.length - 1];
        socket.emit("comment-added", {
          cardId: card._id,
          comment: {
            ...latestComment,
            user: normalizeUser(latestComment.user),
          },
          boardId: card.board,
          actorId: currentUserId,
        });
      }

      setComment("");
      toast.success("Thêm bình luận thành công!");
    } catch (err) {
      console.error("Lỗi thêm bình luận:", err);
      updateCardState(card._id, { comments: card.comments });
      toast.error(
        err.response?.status === 403
          ? "Bạn không có quyền thêm bình luận!"
          : err.response?.data?.message || "Không thể thêm bình luận!"
      );
    } finally {
      setLoading((prev) => ({ ...prev, comment: false }));
    }
  };

  // Thêm ghi chú
  const handleAddNote = async () => {
    if (!note.trim()) {
      toast.error("Ghi chú không được để trống!");
      return;
    }
    if (!currentUserId) {
      toast.error("Không tìm thấy thông tin người dùng hiện tại!");
      return;
    }
    if (!isMemberInBoard(currentUserId)) {
      toast.error("Bạn không có quyền thêm ghi chú trong bảng này!");
      return;
    }

    setLoading((prev) => ({ ...prev, note: true }));

    const tempNote = {
      _id: new Date().toISOString(),
      content: note,
      createdBy: {
        _id: currentUserId,
        fullName: "Bạn",
        avatar: "",
      },
      createdAt: new Date().toISOString(),
      isDeleted: false,
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

      if (socket && socketReady && response.data.length > 0) {
        const latestNote = response.data[response.data.length - 1];
        socket.emit("note-added", {
          cardId: card._id,
          note: {
            ...latestNote,
            createdBy: normalizeUser(latestNote.createdBy),
          },
          boardId: card.board,
          actorId: currentUserId,
        });
      }

      setNote("");
      toast.success("Thêm ghi chú thành công!");
    } catch (err) {
      console.error("Lỗi thêm ghi chú:", err);
      updateCardState(card._id, { notes: card.notes });
      toast.error(
        err.response?.status === 403
          ? "Bạn không có quyền thêm ghi chú!"
          : err.response?.data?.message || "Không thể thêm ghi chú!"
      );
    } finally {
      setLoading((prev) => ({ ...prev, note: false }));
    }
  };

  // Thêm checklist
  const handleAddChecklist = async () => {
    if (!checklistTitle.trim()) {
      toast.error("Tiêu đề checklist không được để trống!");
      return;
    }
    if (!currentUserId) {
      toast.error("Không tìm thấy thông tin người dùng hiện tại!");
      return;
    }
    if (!isMemberInBoard(currentUserId)) {
      toast.error("Bạn không có quyền thêm checklist trong bảng này!");
      return;
    }

    setLoading((prev) => ({ ...prev, checklist: true }));

    const tempChecklist = {
      _id: new Date().toISOString(),
      title: checklistTitle,
      items: [],
    };
    updateCardState(card._id, {
      checklists: [
        ...normalizeChecklists(card.checklists || []),
        tempChecklist,
      ],
    });

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/cards/${card._id}/checklists`,
        { title: checklistTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateCardState(card._id, {
        checklists: normalizeChecklists(response.data),
      });

      if (socket && socketReady) {
        const newChecklist = normalizeChecklists(response.data).slice(-1)[0];
        socket.emit("checklist-added", {
          cardId: card._id,
          checklist: newChecklist,
          boardId: card.board,
          actorId: currentUserId,
        });
        console.log("Emitted checklist-added:", {
          cardId: card._id,
          checklist: newChecklist,
          boardId: card.board,
          actorId: currentUserId,
        });
      }

      setChecklistTitle("");
      toast.success("Thêm checklist thành công!");
    } catch (err) {
      console.error("Lỗi thêm checklist:", err);
      updateCardState(card._id, { checklists: card.checklists });
      toast.error(
        err.response?.status === 403
          ? "Bạn không có quyền thêm checklist!"
          : err.response?.data?.message || "Không thể thêm checklist!"
      );
    } finally {
      setLoading((prev) => ({ ...prev, checklist: false }));
    }
  };

  // Thêm item checklist
  const handleAddChecklistItem = async (checklistId) => {
    if (!checklistItem.trim()) {
      toast.error("Item checklist không được để trống!");
      return;
    }
    if (!currentUserId) {
      toast.error("Không tìm thấy thông tin người dùng hiện tại!");
      return;
    }
    if (!isMemberInBoard(currentUserId)) {
      toast.error("Bạn không có quyền thêm item checklist trong bảng này!");
      return;
    }

    const currentChecklists = normalizeChecklists(card.checklists || []);
    const checklist = currentChecklists.find((cl) => cl._id === checklistId);
    if (!checklist) {
      toast.error("Checklist không tồn tại!");
      return;
    }

    setLoading((prev) => ({ ...prev, checklistItem: true }));

    const newItem = {
      _id: new Date().toISOString(),
      text: checklistItem,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    updateCardState(card._id, {
      checklists: currentChecklists.map((cl) =>
        cl._id === checklistId ? { ...cl, items: [...cl.items, newItem] } : cl
      ),
    });

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/cards/${card._id}/checklists/${checklistId}/items`,
        { text: checklistItem },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateCardState(card._id, {
        checklists: normalizeChecklists(response.data),
      });

      if (socket && socketReady) {
        const updatedChecklist = normalizeChecklists(response.data).find(
          (cl) => cl._id === checklistId
        );
        const newItem =
          updatedChecklist.items[updatedChecklist.items.length - 1];
        socket.emit("checklist-item-added", {
          cardId: card._id,
          checklistId,
          item: newItem,
          checklist: updatedChecklist,
          boardId: card.board,
          actorId: currentUserId,
        });
        console.log("Emitted checklist-item-added:", {
          cardId: card._id,
          checklistId,
          item: newItem,
          checklist: updatedChecklist,
          boardId: card.board,
          actorId: currentUserId,
        });
      }

      setChecklistItem("");
      toast.success("Thêm item checklist thành công!");
    } catch (err) {
      console.error("Lỗi thêm item checklist:", err);
      updateCardState(card._id, { checklists: card.checklists });
      toast.error(
        err.response?.status === 403
          ? "Bạn không có quyền thêm item checklist!"
          : err.response?.data?.message || "Không thể thêm item checklist!"
      );
    } finally {
      setLoading((prev) => ({ ...prev, checklistItem: false }));
    }
  };

  // Toggle item checklist
  const handleToggleChecklistItem = async (checklistId, itemId) => {
    if (!currentUserId) {
      toast.error("Không tìm thấy thông tin người dùng hiện tại!");
      return;
    }
    if (!isMemberInBoard(currentUserId)) {
      toast.error("Bạn không có quyền cập nhật item checklist trong bảng này!");
      return;
    }

    const currentChecklists = normalizeChecklists(card.checklists || []);
    const checklist = currentChecklists.find((cl) => cl._id === checklistId);
    if (!checklist) {
      toast.error("Checklist không tồn tại!");
      return;
    }
    const item = checklist.items.find((item) => item._id === itemId);
    if (!item) {
      toast.error("Item checklist không tồn tại!");
      return;
    }

    setLoading((prev) => ({ ...prev, checklistToggle: true }));

    const newCompleted = !item.completed;
    updateCardState(card._id, {
      checklists: currentChecklists.map((cl) =>
        cl._id === checklistId
          ? {
            ...cl,
            items: cl.items.map((it) =>
              it._id === itemId ? { ...it, completed: newCompleted } : it
            ),
          }
          : cl
      ),
    });

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/cards/${card._id}/checklists/${checklistId}/items/${itemId}/toggle`,
        { completed: newCompleted },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateCardState(card._id, {
        checklists: normalizeChecklists(response.data),
      });

      if (socket && socketReady) {
        socket.emit("checklist-item-toggled", {
          cardId: card._id,
          checklistId,
          itemId,
          completed: newCompleted,
          boardId: card.board,
          actorId: currentUserId,
        });
        console.log("Emitted checklist-item-toggled:", {
          cardId: card._id,
          checklistId,
          itemId,
          completed: newCompleted,
          boardId: card.board,
          actorId: currentUserId,
        });
      }

      toast.success("Cập nhật trạng thái item checklist thành công!");
    } catch (err) {
      console.error("Lỗi toggle item checklist:", err);
      updateCardState(card._id, { checklists: card.checklists });
      toast.error(
        err.response?.status === 403
          ? "Bạn không có quyền cập nhật item checklist!"
          : err.response?.data?.message || "Không thể toggle item checklist!"
      );
    } finally {
      setLoading((prev) => ({ ...prev, checklistToggle: false }));
    }
  };

  // Cập nhật checklist
  const handleUpdateChecklist = async (checklistId, title) => {
    if (!title.trim()) {
      toast.error("Tiêu đề checklist không được để trống!");
      return;
    }
    if (!currentUserId) {
      toast.error("Không tìm thấy thông tin người dùng hiện tại!");
      return;
    }
    if (!isMemberInBoard(currentUserId)) {
      toast.error("Bạn không có quyền cập nhật checklist trong bảng này!");
      return;
    }

    const currentChecklists = normalizeChecklists(card.checklists || []);
    const checklist = currentChecklists.find((cl) => cl._id === checklistId);
    if (!checklist) {
      toast.error("Checklist không tồn tại!");
      return;
    }

    setLoading((prev) => ({ ...prev, checklist: true }));

    updateCardState(card._id, {
      checklists: currentChecklists.map((cl) =>
        cl._id === checklistId ? { ...cl, title } : cl
      ),
    });

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/cards/${card._id}/checklists/${checklistId}`,
        { title },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateCardState(card._id, {
        checklists: normalizeChecklists(response.data),
      });

      if (socket && socketReady) {
        const updatedChecklist = normalizeChecklists(response.data).find(
          (cl) => cl._id === checklistId
        );
        socket.emit("checklist-updated", {
          cardId: card._id,
          checklistId,
          title,
          checklist: updatedChecklist,
          boardId: card.board,
          actorId: currentUserId,
        });
        console.log("Emitted checklist-updated:", {
          cardId: card._id,
          checklistId,
          title,
          checklist: updatedChecklist,
          boardId: card.board,
          actorId: currentUserId,
        });
      }

      toast.success("Cập nhật checklist thành công!");
    } catch (err) {
      console.error("Lỗi cập nhật checklist:", err);
      updateCardState(card._id, { checklists: card.checklists });
      toast.error(
        err.response?.status === 403
          ? "Bạn không có quyền cập nhật checklist!"
          : err.response?.data?.message || "Không thể cập nhật checklist!"
      );
    } finally {
      setLoading((prev) => ({ ...prev, checklist: false }));
    }
  };

  // Xóa checklist
  const handleDeleteChecklist = async (checklistId) => {
    if (!currentUserId) {
      toast.error("Không tìm thấy thông tin người dùng hiện tại!");
      return;
    }
    if (!isMemberInBoard(currentUserId)) {
      toast.error("Bạn không có quyền xóa checklist trong bảng này!");
      return;
    }

    const currentChecklists = normalizeChecklists(card.checklists || []);
    const checklist = currentChecklists.find((cl) => cl._id === checklistId);
    if (!checklist) {
      toast.error("Checklist không tồn tại!");
      return;
    }

    setLoading((prev) => ({ ...prev, checklist: true }));

    updateCardState(card._id, {
      checklists: currentChecklists.filter((cl) => cl._id !== checklistId),
    });

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/cards/${card._id}/checklists/${checklistId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (socket && socketReady) {
        socket.emit("checklist-deleted", {
          cardId: card._id,
          checklistId,
          boardId: card.board,
          actorId: currentUserId,
        });
        console.log("Emitted checklist-deleted:", {
          cardId: card._id,
          checklistId,
          boardId: card.board,
          actorId: currentUserId,
        });
      }

      toast.success("Xóa checklist thành công!");
    } catch (err) {
      console.error("Lỗi xóa checklist:", err);
      updateCardState(card._id, { checklists: card.checklists });
      toast.error(
        err.response?.status === 403
          ? "Bạn không có quyền xóa checklist!"
          : err.response?.data?.message || "Không thể xóa checklist!"
      );
    } finally {
      setLoading((prev) => ({ ...prev, checklist: false }));
    }
  };

  // Cập nhật item checklist
  const handleUpdateChecklistItem = async (checklistId, itemId, text) => {
    if (!text.trim()) {
      toast.error("Item checklist không được để trống!");
      return;
    }
    if (!currentUserId) {
      toast.error("Không tìm thấy thông tin người dùng hiện tại!");
      return;
    }
    if (!isMemberInBoard(currentUserId)) {
      toast.error("Bạn không có quyền cập nhật item checklist trong bảng này!");
      return;
    }

    const currentChecklists = normalizeChecklists(card.checklists || []);
    const checklist = currentChecklists.find((cl) => cl._id === checklistId);
    if (!checklist) {
      toast.error("Checklist không tồn tại!");
      return;
    }
    const item = checklist.items.find((item) => item._id === itemId);
    if (!item) {
      toast.error("Item checklist không tồn tại!");
      return;
    }

    setLoading((prev) => ({ ...prev, checklistItem: true }));

    updateCardState(card._id, {
      checklists: currentChecklists.map((cl) =>
        cl._id === checklistId
          ? {
            ...cl,
            items: cl.items.map((it) =>
              it._id === itemId ? { ...it, text } : it
            ),
          }
          : cl
      ),
    });

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/cards/${card._id}/checklists/${checklistId}/items/${itemId}`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateCardState(card._id, {
        checklists: normalizeChecklists(response.data),
      });

      if (socket && socketReady) {
        const updatedChecklist = normalizeChecklists(response.data).find(
          (cl) => cl._id === checklistId
        );
        socket.emit("checklist-item-updated", {
          cardId: card._id,
          checklistId,
          itemId,
          item: { text },
          checklist: updatedChecklist,
          boardId: card.board,
          actorId: currentUserId,
        });
        console.log("Emitted checklist-item-updated:", {
          cardId: card._id,
          checklistId,
          itemId,
          item: { text },
          checklist: updatedChecklist,
          boardId: card.board,
          actorId: currentUserId,
        });
      }

      toast.success("Cập nhật item checklist thành công!");
    } catch (err) {
      console.error("Lỗi cập nhật item checklist:", err);
      updateCardState(card._id, { checklists: card.checklists });
      toast.error(
        err.response?.status === 403
          ? "Bạn không có quyền cập nhật item checklist!"
          : err.response?.data?.message || "Không thể cập nhật item checklist!"
      );
    } finally {
      setLoading((prev) => ({ ...prev, checklistItem: false }));
    }
  };

  // Xóa item checklist
  const handleDeleteChecklistItem = async (checklistId, itemId) => {
    if (!currentUserId) {
      toast.error("Không tìm thấy thông tin người dùng hiện tại!");
      return;
    }
    if (!isMemberInBoard(currentUserId)) {
      toast.error("Bạn không có quyền xóa item checklist trong bảng này!");
      return;
    }

    const currentChecklists = normalizeChecklists(card.checklists || []);
    const checklist = currentChecklists.find((cl) => cl._id === checklistId);
    if (!checklist) {
      toast.error("Checklist không tồn tại!");
      return;
    }
    const item = checklist.items.find((item) => item._id === itemId);
    if (!item) {
      toast.error("Item checklist không tồn tại!");
      return;
    }

    setLoading((prev) => ({ ...prev, checklistItem: true }));

    updateCardState(card._id, {
      checklists: currentChecklists.map((cl) =>
        cl._id === checklistId
          ? {
            ...cl,
            items: cl.items.filter((it) => it._id !== itemId),
          }
          : cl
      ),
    });

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/cards/${card._id}/checklists/${checklistId}/items/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (socket && socketReady) {
        socket.emit("checklist-item-deleted", {
          cardId: card._id,
          checklistId,
          itemId,
          boardId: card.board,
          actorId: currentUserId,
        });
        console.log("Emitted checklist-item-deleted:", {
          cardId: card._id,
          checklistId,
          itemId,
          boardId: card.board,
          actorId: currentUserId,
        });
      }

      toast.success("Xóa item checklist thành công!");
    } catch (err) {
      console.error("Lỗi xóa item checklist:", err);
      updateCardState(card._id, { checklists: card.checklists });
      toast.error(
        err.response?.status === 403
          ? "Bạn không có quyền xóa item checklist!"
          : err.response?.data?.message || "Không thể xóa item checklist!"
      );
    } finally {
      setLoading((prev) => ({ ...prev, checklistItem: false }));
    }
  };

  // Xóa thành viên khỏi thẻ
  const handleRemoveMember = async (memberId) => {
    if (memberId === currentUserId) {
      toast.error("Bạn không thể xóa chính mình khỏi thẻ!");
      return;
    }
    if (!isMemberInBoard(currentUserId)) {
      toast.error("Bạn không có quyền xóa thành viên trong bảng này!");
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
          boardId: card.board,
          actorId: currentUserId,
          message: "Thành viên đã được xóa khỏi thẻ.",
        });
      }

      toast.success("Xóa thành viên khỏi card thành công!");
    } catch (err) {
      console.error("Lỗi xóa thành viên khỏi card:", err);
      toast.error(
        err.response?.status === 403
          ? "Bạn không có quyền xóa thành viên!"
          : err.response?.data?.message || "Không thể xóa thành viên!"
      );
    } finally {
      setLoading((prev) => ({ ...prev, removeMember: false }));
    }
  };

  // Memo hóa dữ liệu
  const memoizedMembers = useMemo(
    () => (card.members || []).map(normalizeUser),
    [card.members]
  );
  const memoizedBoardMembers = useMemo(
    () =>
      localBoardMembers.map((m) => ({
        ...m,
        user: normalizeUser(m.user),
      })),
    [localBoardMembers]
  );

  return (
    <Collapse in={expanded} timeout="auto" unmountOnExit>
      <Box
        sx={{
          p: 2,
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? theme.palette.grey[900]
              : theme.palette.background.paper,
          borderRadius: 1,
          boxShadow: (theme) => theme.shadows[3],
        }}
      >
        {loading.user ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <MembersSection
              members={memoizedMembers}
              boardMembers={memoizedBoardMembers}
              isBoardOwner={isBoardOwner}
              loading={loading}
              handleRemoveMember={handleRemoveMember}
              setOpenAddMemberDialog={setOpenAddMemberDialog}
              isMemberInBoard={isMemberInBoard}
              cardId={card._id}
              setCards={setCards}
              setColumns={setColumns}
            />
            <NotesSection
              note={note}
              setNote={setNote}
              notes={card.notes || []}
              handleAddNote={handleAddNote}
              handleHideNote={handleHideNote}
              loading={loading}
              isMemberInBoard={isMemberInBoard}
              currentUserId={currentUserId}
              isBoardOwner={isBoardOwner}
            />
            <ChecklistsSection
              checklists={card.checklists || []}
              checklistTitle={checklistTitle}
              setChecklistTitle={setChecklistTitle}
              checklistItem={checklistItem}
              setChecklistItem={setChecklistItem}
              handleAddChecklist={handleAddChecklist}
              handleAddChecklistItem={handleAddChecklistItem}
              handleToggleChecklistItem={handleToggleChecklistItem}
              handleEditChecklist={handleUpdateChecklist}
              handleDeleteChecklist={handleDeleteChecklist}
              handleEditChecklistItem={handleUpdateChecklistItem}
              handleDeleteChecklistItem={handleDeleteChecklistItem}
              loading={loading}
            />
            <CommentsSection
              comments={card.comments || []}
              comment={comment}
              setComment={setComment}
              handleAddComment={handleAddComment}
              handleHideComment={handleHideComment}
              loading={loading}
              isMemberInBoard={isMemberInBoard}
              currentUserId={currentUserId}
              isBoardOwner={isBoardOwner}
            />
            <AddMemberDialog
              open={openAddMemberDialog}
              onClose={() => setOpenAddMemberDialog(false)}
              card={card}
              setCards={setCards}
              setColumns={setColumns}
              boardMembers={memoizedBoardMembers}
              setBoardMembers={setLocalBoardMembers}
            />
          </>
        )}
      </Box>
    </Collapse>
  );
}

export default CardDetails;
