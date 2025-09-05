import { useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { normalizeChecklists, normalizeComments, normalizeNotes, normalizeUser } from "../utils/normalize";

export const useCardSocket = (
  socket,
  socketReady,
  card,
  currentUserId,
  updateCardState,
  setColumns,
  pendingNotifications,
  setPendingNotifications
) => {
  const showConsolidatedNotification = useCallback(() => {
    if (!pendingNotifications.length) return;
    const uniqueMessages = [...new Set(pendingNotifications)];
    toast.info(uniqueMessages.join(" "), { toastId: "consolidated-notification" });
    setPendingNotifications([]);
  }, [pendingNotifications,setPendingNotifications]);

  useEffect(() => {
    if (!socket || !socketReady || !card.board) return;

    socket.emit("join-board", { boardId: card.board });

    const handlers = {
      // Xử lý khi thẻ mới được thêm
      "card-added": ({ listId, card: newCard, actorId }) => {
        if (actorId === currentUserId) return;
        updateCardState(newCard._id, {
          ...newCard,
          members: (newCard.members || []).map(normalizeUser),
          comments: normalizeComments(newCard.comments),
          notes: normalizeNotes(newCard.notes),
          checklists: normalizeChecklists(newCard.checklists),
        });
        setColumns((prev) =>
          prev.map((col) =>
            col._id === listId ? { ...col, cards: [...col.cards, newCard] } : col
          )
        );
        setPendingNotifications((prev) => [...prev, "Thẻ mới đã được thêm."]);
      },
      // Xử lý khi thẻ được cập nhật
      "card-updated": ({ card: updatedCard, actorId }) => {
        if (actorId === currentUserId) return;
        updateCardState(updatedCard._id, {
          ...updatedCard,
          members: (updatedCard.members || []).map(normalizeUser),
          comments: normalizeComments(updatedCard.comments),
          notes: normalizeNotes(updatedCard.notes),
          checklists: normalizeChecklists(updatedCard.checklists),
        });
        setPendingNotifications((prev) => [...prev, `Thẻ "${updatedCard.title}" đã được cập nhật.`]);
      },
      // Xử lý khi thẻ được xóa
      "card-hidden": ({ cardId, listId, actorId }) => {
        if (actorId === currentUserId) return;
        setColumns((prev) =>
          prev.map((col) =>
            col._id === listId
              ? { ...col, cards: col.cards.filter((c) => c._id !== cardId) }
              : col
          )
        );
        setPendingNotifications((prev) => [...prev, "Thẻ đã được xóa."]);
      },
      // Xử lý khi thành viên được thêm vào thẻ
      "member-added": ({ cardId, member, actorId }) => {
        if (actorId === currentUserId) return;
        updateCardState(cardId, {
          members: [...(card.members || []), normalizeUser(member)],
        });
        setPendingNotifications((prev) => [...prev, `Thành viên ${member.fullName} đã được thêm vào thẻ.`]);
      },
      // Xử lý khi thành viên bị xóa khỏi thẻ
      "member-removed": ({ cardId, memberId, actorId }) => {
        if (actorId === currentUserId) return;
        updateCardState(cardId, {
          members: (card.members || []).filter((m) => m._id !== memberId),
        });
        setPendingNotifications((prev) => [...prev, "Thành viên đã được xóa khỏi thẻ."]);
      },
      // Xử lý khi ghi chú được thêm
      "note-added": ({ cardId, note, actorId }) => {
        if (actorId === currentUserId) return;
        updateCardState(cardId, {
          notes: [...(card.notes || []), normalizeNotes([note])[0]],
        });
        setPendingNotifications((prev) => [...prev, "Ghi chú mới đã được thêm."]);
      },
      // Xử lý khi ghi chú được ẩn
      "note-hidden": ({ cardId, noteId, actorId }) => {
        if (actorId === currentUserId) return;
        updateCardState(cardId, {
          notes: (card.notes || []).map((n) =>
            n._id === noteId ? { ...n, isHidden: true } : n
          ),
        });
        setPendingNotifications((prev) => [...prev, "Ghi chú đã được ẩn."]);
      },
      // Xử lý khi bình luận được thêm
      "comment-added": ({ cardId, comment, actorId }) => {
        if (actorId === currentUserId) return;
        updateCardState(cardId, {
          comments: [...(card.comments || []), normalizeComments([comment])[0]],
        });
        setPendingNotifications((prev) => [...prev, "Bình luận mới đã được thêm."]);
      },
      // Xử lý khi bình luận được ẩn
      "comment-hidden": ({ cardId, commentId, actorId }) => {
        if (actorId === currentUserId) return;
        updateCardState(cardId, {
          comments: (card.comments || []).map((c) =>
            c._id === commentId ? { ...c, isHidden: true } : c
          ),
        });
        setPendingNotifications((prev) => [...prev, "Bình luận đã được ẩn."]);
      },
      // Xử lý khi danh sách kiểm tra được thêm
      "checklist-added": ({ cardId, checklist, actorId }) => {
        if (actorId === currentUserId) return;
        updateCardState(cardId, {
          checklists: [...(card.checklists || []), normalizeChecklists([checklist])[0]],
        });
        setPendingNotifications((prev) => [...prev, `Danh sách kiểm tra "${checklist.title}" đã được thêm.`]);
      },
      // Xử lý khi danh sách kiểm tra được cập nhật
      "checklist-updated": ({ cardId, checklist, actorId }) => {
        if (actorId === currentUserId) return;
        updateCardState(cardId, {
          checklists: (card.checklists || []).map((c) =>
            c._id === checklist._id ? normalizeChecklists([checklist])[0] : c
          ),
        });
        setPendingNotifications((prev) => [...prev, `Danh sách kiểm tra "${checklist.title}" đã được cập nhật.`]);
      },
      // Xử lý khi danh sách kiểm tra bị xóa
      "checklist-deleted": ({ cardId, checklistId, actorId }) => {
        if (actorId === currentUserId) return;
        updateCardState(cardId, {
          checklists: (card.checklists || []).filter((c) => c._id !== checklistId),
        });
        setPendingNotifications((prev) => [...prev, "Danh sách kiểm tra đã được xóa."]);
      },
      // Xử lý khi mục trong danh sách kiểm tra được thêm
      "hecklist-item-added": ({ cardId, checklistId, item, actorId }) => {
        if (actorId === currentUserId) return;
        updateCardState(cardId, {
          checklists: (card.checklists || []).map((c) =>
            c._id === checklistId
              ? { ...c, items: [...(c.items || []), normalizeChecklists([{ items: [item] }])[0].items[0]] }
              : c
          ),
        });
        setPendingNotifications((prev) => [...prev, "Mục mới đã được thêm vào danh sách kiểm tra."]);
      },
      // Xử lý khi mục trong danh sách kiểm tra được cập nhật
      "checklist-item-updated": ({ cardId, checklistId, item, actorId }) => {
        if (actorId === currentUserId) return;
        updateCardState(cardId, {
          checklists: (card.checklists || []).map((c) =>
            c._id === checklistId
              ? {
                  ...c,
                  items: c.items.map((i) =>
                    i._id === item._id ? normalizeChecklists([{ items: [item] }])[0].items[0] : i
                  ),
                }
              : c
          ),
        });
        setPendingNotifications((prev) => [...prev, "Mục trong danh sách kiểm tra đã được cập nhật."]);
      },
      // Xử lý khi mục trong danh sách kiểm tra bị xóa
      "checklist-item-deleted": ({ cardId, checklistId, itemId, actorId }) => {
        if (actorId === currentUserId) return;
        updateCardState(cardId, {
          checklists: (card.checklists || []).map((c) =>
            c._id === checklistId ? { ...c, items: c.items.filter((i) => i._id !== itemId) } : c
          ),
        });
        setPendingNotifications((prev) => [...prev, "Mục trong danh sách kiểm tra đã được xóa."]);
      },
      // Xử lý khi trạng thái hoàn thành của mục trong danh sách kiểm tra thay đổi
      "checklist-item-toggled": ({ cardId, checklistId, itemId, completed, actorId }) => {
        if (actorId === currentUserId) return;
        updateCardState(cardId, {
          checklists: (card.checklists || []).map((c) =>
            c._id === checklistId
              ? {
                  ...c,
                  items: c.items.map((i) => (i._id === itemId ? { ...i, completed } : i)),
                }
              : c
          ),
        });
        setPendingNotifications((prev) => [...prev, `Mục trong danh sách kiểm tra đã được ${completed ? "hoàn thành" : "bỏ hoàn thành"}.`]);
      },
    };

    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));

    return () => {
      socket.emit("leave-board", { boardId: card.board });
      Object.keys(handlers).forEach((event) => socket.off(event));
    };
  }, [socket, socketReady, card, currentUserId, updateCardState, setColumns, setPendingNotifications]);

  useEffect(() => {
    if (pendingNotifications.length > 0) {
      const timer = setTimeout(showConsolidatedNotification, 1000);
      return () => clearTimeout(timer);
    }
  }, [pendingNotifications, showConsolidatedNotification]);
};