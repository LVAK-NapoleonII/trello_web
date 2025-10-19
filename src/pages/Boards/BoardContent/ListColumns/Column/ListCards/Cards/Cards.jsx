import { useEffect, useContext } from "react";
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
    // ✅ QUAN TRỌNG: Bật animation để card theo chuột
    animateLayoutChanges: undefined, // Hoặc xóa dòng này
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition || undefined, // Để @dnd-kit tự quản lý
    opacity: isDragging ? 0.5 : 1, // Tăng opacity để thấy rõ
    cursor: isDragging ? "grabbing" : "grab",
    zIndex: isDragging ? 1000 : "auto",
    // ✅ Đảm bảo card được render đúng
    touchAction: "none",
  };

  useEffect(() => {
    if (!socket || !socketReady || !boardId) {
      console.warn("Cards: Socket not available, not ready, or no boardId");
      return;
    }

    socket.emit("join-board", { boardId });

    const handleCardDeleted = ({ listId, cardId }) => {
      if (cardId !== card._id) return;
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

      setColumns((prevColumns) => {
        const newColumns = [...prevColumns];

        // Xóa khỏi cột cũ
        const oldColIndex = newColumns.findIndex((c) => c._id === oldListId);
        if (oldColIndex !== -1) {
          newColumns[oldColIndex].cards = newColumns[oldColIndex].cards.filter(
            (c) => c._id !== movedCard._id
          );
        }

        // Thêm vào cột mới
        const newColIndex = newColumns.findIndex((c) => c._id === newListId);
        if (newColIndex !== -1) {
          const targetCards = [...newColumns[newColIndex].cards];
          targetCards.splice(newPosition, 0, { ...movedCard, list: newListId });
          newColumns[newColIndex].cards = targetCards;
        }

        return newColumns;
      });

      toast.info("Thẻ đã được di chuyển.");
    };

    const handleCardUpdated = ({ cardId, card: updatedCard }) => {
      if (cardId !== card._id) return;

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
        boardId={boardId}
      />
    </Box>
  );
}

export default Cards;