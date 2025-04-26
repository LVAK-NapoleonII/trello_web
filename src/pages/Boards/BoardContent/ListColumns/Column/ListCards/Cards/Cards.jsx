import { useState, useEffect, useContext } from "react";
import CardContainer from "./CardContainer";
import { SocketContext } from "../../../../../../../context/SocketContext";
import { toast } from "react-toastify";

function Cards({
  card,
  setCards,
  setColumns,
  boardMembers,
  setBoardMembers,
  boardId,
}) {
  const { socket, socketReady } = useContext(SocketContext);

  console.log("Cards: Props received:", {
    boardMembers,
    isArray: Array.isArray(boardMembers),
    length: boardMembers?.length,
    boardId,
  });

  useEffect(() => {
    if (!socket || !socketReady || !boardId) {
      console.warn("Cards: Socket not available, not ready, or no boardId");
      return;
    }

    // Tham gia phòng boardId
    socket.emit("join-board", { boardId });
    console.log("Cards: Joined board room:", boardId);

    // Xử lý khi thẻ bị xóa
    const handleCardDeleted = ({ listId, cardId }) => {
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

    // Xử lý khi thẻ được di chuyển
    const handleCardMoved = ({ card, oldListId, newListId, newPosition }) => {
      console.log("Cards: Received card-moved:", {
        card,
        oldListId,
        newListId,
        newPosition,
      });
      setColumns((prevColumns) => {
        let updatedColumns = [...prevColumns];
        // Xóa thẻ khỏi danh sách cũ
        updatedColumns = updatedColumns.map((col) =>
          col._id === oldListId
            ? { ...col, cards: col.cards.filter((c) => c._id !== card._id) }
            : col
        );
        // Thêm thẻ vào danh sách mới
        updatedColumns = updatedColumns.map((col) =>
          col._id === newListId
            ? {
                ...col,
                cards: [
                  ...col.cards.slice(0, newPosition),
                  card,
                  ...col.cards.slice(newPosition),
                ],
              }
            : col
        );
        return updatedColumns;
      });
      toast.info("Thẻ đã được di chuyển.");
    };

    // Xử lý khi thẻ được cập nhật
    const handleCardUpdated = ({ cardId, card }) => {
      console.log("Cards: Received card-updated:", { cardId, card });
      setCards((prevCards) =>
        prevCards.map((c) => (c._id === cardId ? { ...c, ...card } : c))
      );
      setColumns((prevColumns) =>
        prevColumns.map((col) => ({
          ...col,
          cards: col.cards.map((c) =>
            c._id === cardId ? { ...c, ...card } : c
          ),
        }))
      );
      toast.info("Thẻ đã được cập nhật.");
    };

    // Xử lý khi trạng thái hoàn thành thay đổi
    const handleCardCompletionToggled = ({ cardId, completed }) => {
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

    // Cleanup
    return () => {
      socket.emit("leave-board", { boardId });
      console.log("Cards: Left board room:", boardId);
      socket.off("card-deleted", handleCardDeleted);
      socket.off("card-moved", handleCardMoved);
      socket.off("card-updated", handleCardUpdated);
      socket.off("card-completion-toggled", handleCardCompletionToggled);
    };
  }, [socket, socketReady, boardId, setCards, setColumns]);

  return (
    <CardContainer
      card={card}
      setCards={setCards}
      setColumns={setColumns}
      boardMembers={boardMembers}
      setBoardMembers={setBoardMembers}
    />
  );
}

export default Cards;
