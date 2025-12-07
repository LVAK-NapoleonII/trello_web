import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import Cards from "./Cards/Cards";
import Box from "@mui/material/Box";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import axios from "axios";
import { toast } from "react-toastify";
import { SocketContext } from "../../../../../../context/SocketContext";
import { useTheme } from "@mui/material/styles";

function ListCards({
  listId,
  cards,
  setColumns,
  boardMembers,
  setBoardMembers,
  boardId,
  predictedPosition,
  currentUserId,
  isBoardOwner,
}) {
  const { socket, socketReady } = useContext(SocketContext);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const { setNodeRef, isOver } = useDroppable({
    id: `list-${listId}`,
    data: { type: "List", listId },
  });

  useEffect(() => {
    if (!socket || !socketReady || !boardId) return;

    socket.emit("join-board", { boardId });


    const handleCardOrderUpdated = ({ listId: updatedListId, cardOrder }) => {
      if (updatedListId !== listId) return;

      if (!Array.isArray(cardOrder)) return;

      setColumns((prev) =>
        prev.map((col) =>
          col._id === listId
            ? {
              ...col,
              cardOrderIds: cardOrder,
              cards: cardOrder
                .map((id) => col.cards.find((c) => c._id === id))
                .filter(Boolean)
                .map((card, index) => ({ ...card, position: index })),
            }
            : col
        )
      );
    };


    const handleCardMoved = ({ card, oldListId, newListId, newPosition }) => {
      setColumns((prev) => {
        let newCols = [...prev];

        // XÓA KHỎI LIST CŨ
        if (oldListId) {
          newCols = newCols.map((col) =>
            col._id === oldListId
              ? {
                ...col,
                cards: col.cards.filter((c) => c._id !== card._id),
                cardOrderIds: col.cards.filter((c) => c._id !== card._id).map((c) => c._id),
              }
              : col
          );
        }

        // THÊM VÀO LIST MỚI
        if (newListId === listId) {
          const target = newCols.find((col) => col._id === newListId);
          if (target) {
            const filtered = target.cards.filter((c) => c._id !== card._id);
            const pos = Math.min(newPosition, filtered.length);
            const newCards = [...filtered];
            newCards.splice(pos, 0, { ...card, list: newListId, position: pos });

            newCols = newCols.map((col) =>
              col._id === newListId
                ? { ...col, cards: newCards, cardOrderIds: newCards.map((c) => c._id) }
                : col
            );
          }
        }

        return newCols;
      });
    };

    const handleCardCreated = ({ listId: updatedListId, card }) => {
      if (updatedListId !== listId) return;

      setColumns((prev) =>
        prev.map((col) =>
          col._id === listId
            ? {
              ...col,
              cards: col.cards.some((c) => c._id === card._id)
                ? col.cards
                : [...col.cards, { ...card, position: col.cards.length }],
              cardOrderIds: col.cards.some((c) => c._id === card._id)
                ? col.cardOrderIds
                : [...col.cardOrderIds, card._id],
            }
            : col
        )
      );
    };
    socket.on("card-order-updated", handleCardOrderUpdated);
    socket.on("card-moved", handleCardMoved);
    socket.on("card-created", handleCardCreated);

    return () => {
      socket.off("card-order-updated", handleCardOrderUpdated);
      socket.off("card-moved", handleCardMoved);
      socket.off("card-created", handleCardCreated);
      socket.emit("leave-board", { boardId });
    };
  }, [socket, socketReady, listId, boardId]);

  const uniqueCards = useMemo(() => {
    if (!Array.isArray(cards)) return [];
    const seen = new Set();
    return cards.filter((card) => card?._id && !seen.has(card._id) && seen.add(card._id));
  }, [cards]);

  const sortableItems = useMemo(() => uniqueCards.map((c) => c._id), [uniqueCards]);

  const renderPlaceholder = (index) => {
    if (
      !predictedPosition ||
      predictedPosition.listId !== listId ||
      predictedPosition.index !== index
    ) {
      return null;
    }
    const placeholderHeight = predictedPosition.height || 100;
    return (
      <Box
        key={`placeholder-${index}`}
        data-no-dnd="true"
        sx={{
          height: `${placeholderHeight}px`,
          bgcolor: isDarkMode
            ? "rgba(100, 181, 246, 0.2)"
            : "rgba(33, 150, 243, 0.1)",
          borderRadius: "12px",
          border: `2px dashed ${isDarkMode ? "#64B5F6" : "#2196F3"}`,
          opacity: 1,
          transition: "height 0.2s ease",
          boxShadow: isDarkMode
            ? "0 4px 12px rgba(100, 181, 246, 0.3)"
            : "0 4px 12px rgba(33, 150, 243, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          my: 1,
          mx: 1,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <Box
          sx={{
            width: "90%",
            height: "80%",
            borderRadius: "8px",
            bgcolor: isDarkMode
              ? "rgba(100, 181, 246, 0.15)"
              : "rgba(33, 150, 243, 0.08)",
            animation: "pulse 1.5s ease-in-out infinite",
            "@keyframes pulse": {
              "0%, 100%": { opacity: 0.5 },
              "50%": { opacity: 1 },
            },
          }}
        />
      </Box>
    );
  };

  const renderCards = useCallback(() => {
    const result = [];

    uniqueCards.forEach((card, index) => {
      result.push(renderPlaceholder(index));

      result.push(
        <Cards
          key={card._id}
          card={card}
          setColumns={setColumns}
          boardMembers={boardMembers}
          setBoardMembers={setBoardMembers}
          boardId={boardId}
          columnId={listId}
          currentUserId={currentUserId}
          isBoardOwner={isBoardOwner}
        />
      );
    });

    result.push(renderPlaceholder(cards.length));

    return result;
  }, [
    uniqueCards,
    predictedPosition,
    listId,
    isDarkMode,
    boardMembers,
    setBoardMembers,
    boardId,
    setColumns,
    currentUserId,
    isBoardOwner,
  ]);

  return (
    <Box
      ref={setNodeRef}
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        overflowX: "hidden",
        flexGrow: 1,
        bgcolor: isOver
          ? isDarkMode
            ? "rgba(100, 181, 246, 0.05)"
            : "rgba(33, 150, 243, 0.03)"
          : "transparent",
        borderRadius: "12px",
        minHeight: "120px",
        transition: "background-color 0.2s ease",
        border: isOver
          ? `2px dashed ${isDarkMode ? "#64B5F6" : "#2196F3"}`
          : "2px dashed transparent",
        transform: isOver ? "scale(1.01)" : "scale(1)",
        "&:hover": {
          bgcolor: isDarkMode
            ? "rgba(255,255,255,0.02)"
            : theme.palette.grey[50],
        },
      }}
    >
      <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
        {uniqueCards.length > 0 || predictedPosition?.listId === listId ? (
          renderCards()
        ) : (
          <Box
            sx={{
              p: 2,
              color: isDarkMode ? theme.palette.grey[400] : theme.palette.text.secondary,
              bgcolor: isDarkMode ? "rgba(255,255,255,0.05)" : theme.palette.grey[100],
              borderRadius: "8px",
              textAlign: "center",
              fontWeight: 500,
              minHeight: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
          >
            Không có thẻ nào trong cột này.
          </Box>
        )}
      </SortableContext>
    </Box>
  );
}

export default ListCards;