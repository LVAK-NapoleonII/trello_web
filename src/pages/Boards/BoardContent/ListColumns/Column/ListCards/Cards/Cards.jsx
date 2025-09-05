import { useState, useEffect, useContext } from "react";
import CardContainer from "./CardContainer";
import { SocketContext } from "../../../../../../../context/SocketContext";
import { toast } from "react-toastify";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Box from "@mui/material/Box";

function Cards({
  card,
  setCards,
  setColumns,
  boardMembers,
  setBoardMembers,
  boardId,
}) {
  const { socket, socketReady } = useContext(SocketContext);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card._id,
    data: { type: "Card", card },
    animateLayoutChanges: () => false,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition || "transform 0.1s ease",
    opacity: isDragging ? 0.6 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    zIndex: isDragging ? 1000 : "auto",
  };

  useEffect(() => {
    if (!socket || !socketReady || !boardId) {
      console.warn("Cards: Socket not available, not ready, or no boardId");
      return;
    }

    socket.emit("join-board", { boardId });
    console.log("Cards: Emitted join-board:", { boardId });

    const handleCardDeleted = ({ listId, cardId }) => {
      if (cardId !== card._id) return;
      console.log("Cards: Received card-deleted:", { listId, cardId });
      setCards((prevCards) => prevCards.filter((c) => c._id !== cardId));
      setColumns((prevColumns) =>
        prevColumns.map((col) =>
          col._id === listId
            ? { ...col, cards: col.cards.filter((c) => c._id !== cardId) }
            : col
        )
      );
      toast.info("Thẻ đã được xóa.");
    };

    const handleCardMoved = ({
      card: movedCard,
      oldListId,
      newListId,
      newPosition,
    }) => {
      if (movedCard._id !== card._id) return;
      console.log("Cards: Received card-moved:", {
        cardId: movedCard._id,
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
                { ...movedCard, list: newListId },
                ...col.cards.slice(newPosition),
              ],
            }
            : col
        );
        return updatedColumns;
      });
      toast.info("Thẻ đã được di chuyển.");
    };

    const handleCardUpdated = ({ cardId, card: updatedCard }) => {
      if (cardId !== card._id) return;
      console.log("Cards: Received card-updated:", {
        cardId,
        card: updatedCard,
      });
      setCards((prevCards) =>
        prevCards.map((c) => (c._id === cardId ? { ...c, ...updatedCard } : c))
      );
      setColumns((prevColumns) =>
        prevColumns.map((col) => ({
          ...col,
          cards: col.cards.map((c) =>
            c._id === cardId ? { ...c, ...updatedCard } : c
          ),
        }))
      );
      toast.info("Thẻ đã được cập nhật.");
    };

    const handleCardCompletionToggled = ({ cardId, completed }) => {
      if (cardId !== card._id) return;
      console.log("Cards: Received card-completion-toggled:", {
        cardId,
        completed,
      });
      setCards((prevCards) =>
        prevCards.map((c) => (c._id === cardId ? { ...c, completed } : c))
      );
      setColumns((prevColumns) =>
        prevColumns.map((col) => ({
          ...col,
          cards: col.cards.map((c) =>
            c._id === cardId ? { ...c, completed } : c
          ),
        }))
      );
      toast.info(
        `Thẻ đã được ${completed ? "đánh dấu hoàn thành" : "bỏ hoàn thành"}.`
      );
    };

    socket.on("card-deleted", handleCardDeleted);
    socket.on("card-moved", handleCardMoved);
    socket.on("card-updated", handleCardUpdated);
    socket.on("card-completion-toggled", handleCardCompletionToggled);

    return () => {
      socket.off("card-deleted", handleCardDeleted);
      socket.off("card-moved", handleCardMoved);
      socket.off("card-updated", handleCardUpdated);
      socket.off("card-completion-toggled", handleCardCompletionToggled);
      socket.emit("leave-board", { boardId });
      console.log("Cards: Emitted leave-board:", { boardId });
    };
  }, [socket, socketReady, boardId, card._id, setCards, setColumns]);

  return (
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardContainer
        card={card}
        setCards={setCards}
        setColumns={setColumns}
        boardMembers={boardMembers}
        setBoardMembers={setBoardMembers}
      />
    </Box>
  );
}

export default Cards;
