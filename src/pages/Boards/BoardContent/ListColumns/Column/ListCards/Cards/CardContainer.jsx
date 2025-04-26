import { useState, useEffect, useContext } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@mui/material";
import CardCover from "./CardCover";
import CardHeader from "./CardHeader";
import CardDetails from "./CardDetails";
import CardActionsPanel from "./CardActionsPanel";
import { SocketContext } from "../../../../../../../context/SocketContext";
import { toast } from "react-toastify";

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

  useEffect(() => {
    if (!socket || !socketReady || !boardId) {
      console.warn(
        "CardContainer: Socket not available, not ready, or no boardId"
      );
      return;
    }

    // Tham gia phòng boardId
    socket.emit("join-board", { boardId });
    console.log("CardContainer: Joined board room:", boardId);

    // Xử lý khi thẻ bị xóa
    const handleCardDeleted = ({ listId, cardId }) => {
      if (cardId === card._id) {
        console.log("CardContainer: Received card-deleted:", {
          listId,
          cardId,
        });
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
        console.log("CardContainer: Received card-moved:", {
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
        console.log("CardContainer: Received card-updated:", {
          cardId,
          updatedCard,
        });
        setCards((prevCards) =>
          prevCards.map((c) =>
            c._id === cardId ? { ...c, ...updatedCard } : c
          )
        );
        setColumns((prevColumns) =>
          prevColumns.map((col) =>
            col._id === card.list
              ? {
                  ...col,
                  cards: col.cards.map((c) =>
                    c._id === cardId ? { ...c, ...updatedCard } : c
                  ),
                }
              : col
          )
        );
        toast.info("Thẻ đã được cập nhật.");
      }
    };

    // Xử lý khi trạng thái hoàn thành thay đổi
    const handleCardCompletionToggled = ({ cardId, completed }) => {
      if (cardId === card._id) {
        console.log("CardContainer: Received card-completion-toggled:", {
          cardId,
          completed,
        });
        setCards((prevCards) =>
          prevCards.map((c) => (c._id === cardId ? { ...c, completed } : c))
        );
        setColumns((prevColumns) =>
          prevColumns.map((col) =>
            col._id === card.list
              ? {
                  ...col,
                  cards: col.cards.map((c) =>
                    c._id === cardId ? { ...c, completed } : c
                  ),
                }
              : col
          )
        );
        toast.info(
          `Thẻ đã được ${completed ? "đánh dấu hoàn thành" : "bỏ hoàn thành"}.`
        );
      }
    };

    socket.on("card-deleted", handleCardDeleted);
    socket.on("card-moved", handleCardMoved);
    socket.on("card-updated", handleCardUpdated);
    socket.on("card-completion-toggled", handleCardCompletionToggled);

    return () => {
      socket.emit("leave-board", { boardId });
      console.log("CardContainer: Left board room:", boardId);
      socket.off("card-deleted", handleCardDeleted);
      socket.off("card-moved", handleCardMoved);
      socket.off("card-updated", handleCardUpdated);
      socket.off("card-completion-toggled", handleCardCompletionToggled);
    };
  }, [socket, socketReady, boardId, card._id, card.list, setCards, setColumns]);

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
      {card.cover && <CardCover cover={card.cover} />}
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
