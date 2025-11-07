import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@mui/material";
import CardHeader from "./CardHeader";
import CardDetails from "./CardDetails";
import CardActionsPanel from "./CardActionsPanel";
import { SocketContext } from "../../../../../../../context/SocketContext";
import { toast } from "react-toastify";

const normalizeUser = (user) => ({
  _id: user?._id || "unknown",
  fullName: user?.fullName || user?.email || "Unknown User",
  avatar: user?.avatar || "",
  email: user?.email || "",
});

const normalizeChecklists = (checklists) => {
  if (!Array.isArray(checklists)) {
    console.warn("Checklists không phải là mảng:", checklists);
    return [];
  }
  return checklists.map((checklist) => ({
    _id: checklist._id || new Date().toISOString(),
    title: checklist.title || "Untitled Checklist",
    items: Array.isArray(checklist.items)
      ? checklist.items.map((item) => ({
        _id: item._id || new Date().toISOString(),
        text: item.text || "",
        completed: !!item.completed,
        createdAt: item.createdAt || new Date().toISOString(),
      }))
      : [],
  }));
};

function CardContainer({
  card,
  setCards,
  setColumns,
  boardMembers,
  setBoardMembers,
  boardId,
}) {
  const { socket, socketReady } = useContext(SocketContext);
  const [expanded, setExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card._id,
    data: { ...card, type: "Card" },
  });

  const dndKitCardStyles = {
    touchAction: "none",
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    border: isDragging
      ? "2px solid"
      : card.completed
        ? "2px solid"
        : "1px solid",
    borderColor: isDragging
      ? (theme) => theme.palette.success.main
      : card.completed
        ? (theme) => theme.palette.success.main
        : (theme) => theme.palette.divider,
  };

  const updateCardState = useCallback(
    (cardId, updatedFields) => {
      setCards((prevCards) =>
        prevCards.map((c) =>
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
                updatedFields.checklists || c.checklists
              ),
            }
            : c
        )
      );
      setColumns((prevColumns) =>
        prevColumns.map((col) => ({
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
                  updatedFields.checklists || c.checklists
                ),
              }
              : c
          ),
        }))
      );
    },
    [setCards, setColumns]
  );

  useEffect(() => {
    if (!socket || !socketReady || !boardId || typeof boardId !== 'string' || boardId.trim() === '') {
      console.warn("CardContainer: Socket not available, not ready, or invalid boardId", { socket: !!socket, socketReady, boardId });
      return;
    }

    socket.emit("join-board", { boardId });

    const socketHandlers = {
      "card-deleted": ({ listId, cardId }) => {
        if (cardId === card._id) {
          setCards((prevCards) => prevCards.filter((c) => c._id !== cardId));
          setColumns((prevColumns) =>
            prevColumns.map((col) =>
              col._id === listId
                ? { ...col, cards: col.cards.filter((c) => c._id !== cardId) }
                : col
            )
          );
          setExpanded(false);
          toast.info("Thẻ đã được xóa.");
        }
      },

      "card-moved": ({
        card: movedCard,
        oldListId,
        newListId,
        newPosition,
      }) => {
        if (movedCard._id === card._id) {
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
          toast.info("Thẻ đã được di chuyển.");
        }
      },

      "card-updated": ({ cardId, card: updatedCard }) => {
        if (cardId === card._id) {
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
          toast.info("Thẻ đã được cập nhật.");
        }
      },

      "card-completion-toggled": ({ cardId, completed }) => {
        if (cardId === card._id) {
          updateCardState(cardId, { completed });
          toast.info(
            `Thẻ đã được ${completed ? "đánh dấu hoàn thành" : "bỏ hoàn thành"}.`
          );
        }
      },
    };

    Object.entries(socketHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      socket.emit("leave-board", { boardId });
      Object.keys(socketHandlers).forEach((event) => {
        socket.off(event, socketHandlers[event]);
      });
    };
  }, [socket, socketReady, boardId, card._id, card.list, updateCardState]);

  return (
    <Card
      ref={setNodeRef}
      sx={{
        bgcolor: "background.paper",
        borderRadius: 2,
        mb: 1,
        boxShadow: 3,
        ...dndKitCardStyles,
      }}
      {...attributes}
      {...listeners}
    >
      <CardHeader
        card={card}
        setCards={setCards}
        setColumns={setColumns}
        setExpanded={setExpanded}
      />
      <CardDetails
        card={card}
        setCards={setCards}
        setColumns={setColumns}
        expanded={expanded}
        setExpanded={setExpanded}
        boardMembers={boardMembers}
        setBoardMembers={setBoardMembers}
      />
      <CardActionsPanel
        card={card}
        setCards={setCards}
        setColumns={setColumns}
        boardMembers={boardMembers}
        boardId={boardId}
      />
    </Card>
  );
}

export default CardContainer;