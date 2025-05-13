import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import Cards from "./Cards/Cards";
import Box from "@mui/material/Box";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { closestCenter, DndContext } from "@dnd-kit/core";
import axios from "axios";
import { toast } from "react-toastify";
import { SocketContext } from "../../../../../../context/SocketContext";
import { useTheme } from "@mui/material/styles";

function ListCards({
  listId,
  refresh,
  setColumns,
  boardMembers,
  setBoardMembers,
  boardId,
  predictedPosition,
}) {
  const { socket, socketReady } = useContext(SocketContext);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [cards, setCards] = useState([]);

  const { setNodeRef, isOver } = useDroppable({
    id: `list-${listId}`,
    data: { type: "List", listId },
    // Increase tolerance for droppable area
    tolerance: 10,
  });

  const fetchCards = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token! Vui lòng đăng nhập lại.");
      }

      const response = await axios.get(
        `http://localhost:5000/api/cards/list/${listId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const uniqueCards = response.data.filter(
        (card, index, self) =>
          self.findIndex((c) => c._id === card._id) === index
      );
      setCards(uniqueCards);
      console.log("ListCards: Fetched cards for list:", {
        listId,
        cards: uniqueCards,
      });
      setColumns((prevColumns) =>
        prevColumns.map((col) =>
          col._id === listId ? { ...col, cards: uniqueCards } : col
        )
      );
    } catch (err) {
      console.error("ListCards: Error fetching cards:", {
        message: err.message,
        response: err.response?.data,
      });
      toast.error(
        `Lỗi khi tải danh sách thẻ: ${err.response?.data?.message || err.message
        }`
      );
    }
  }, [listId, setColumns]);

  useEffect(() => {
    if (!listId) {
      console.error("ListCards: listId is undefined or null");
      return;
    }
    fetchCards();
  }, [listId, refresh, fetchCards]);

  useEffect(() => {
    if (!socket || !socketReady || !boardId) {
      console.warn(
        "ListCards: Socket not available, not ready, or no boardId",
        {
          socket: !!socket,
          socketReady,
          boardId,
        }
      );
      return;
    }

    socket.emit("join-board", { boardId });
    console.log("ListCards: Emitted join-board:", { boardId });

    const handleCardOrderUpdated = ({ listId: updatedListId, cardOrder }) => {
      if (updatedListId !== listId) return;
      console.log("ListCards: Received card-order-updated:", {
        listId,
        cardOrder,
      });

      if (!Array.isArray(cardOrder)) {
        console.error(
          "ListCards: Invalid cardOrder, expected array:",
          cardOrder
        );
        toast.error("Lỗi khi cập nhật thứ tự thẻ!");
        fetchCards();
        return;
      }

      setCards((prevCards) => {
        const missingIds = cardOrder.filter(
          (id) => !prevCards.some((card) => card._id === id)
        );
        if (missingIds.length > 0) {
          console.warn(
            "ListCards: Some card IDs in cardOrder not found:",
            missingIds
          );
          fetchCards();
          return prevCards;
        }

        const reorderedCards = cardOrder
          .map((id) => prevCards.find((card) => card._id === id))
          .filter((card) => card);
        const uniqueCards = reorderedCards.filter(
          (card, index, self) =>
            self.findIndex((c) => c._id === card._id) === index
        );
        console.log("ListCards: Reordered cards:", uniqueCards);

        return [...uniqueCards];
      });

      setColumns((prevColumns) =>
        prevColumns.map((col) =>
          col._id === listId
            ? {
              ...col,
              cards: cardOrder
                .map((id) => col.cards.find((card) => card._id === id))
                .filter((card) => card)
                .filter(
                  (card, index, self) =>
                    self.findIndex((c) => c._id === card._id) === index
                ),
            }
            : col
        )
      );
      toast.info("Thứ tự thẻ đã được cập nhật!");
    };

    const handleCardMoved = ({ card, oldListId, newListId, newPosition }) => {
      console.log("ListCards: Received card-moved:", {
        cardId: card._id,
        oldListId,
        newListId,
        newPosition,
      });
      if (oldListId === listId) {
        setCards((prevCards) => {
          const newCards = prevCards.filter((c) => c._id !== card._id);
          console.log("ListCards: Removed card from source list:", {
            listId,
            cardId: card._id,
            newCards,
          });
          return [...newCards];
        });
        setColumns((prevColumns) =>
          prevColumns.map((col) =>
            col._id === listId
              ? { ...col, cards: col.cards.filter((c) => c._id !== card._id) }
              : col
          )
        );
      } else if (newListId === listId) {
        setCards((prevCards) => {
          if (prevCards.some((c) => c._id === card._id)) {
            console.warn(
              "ListCards: Card already exists in destination list, updating position:",
              {
                listId,
                cardId: card._id,
              }
            );
            const filteredCards = prevCards.filter((c) => c._id !== card._id);
            const newCards = [...filteredCards];
            newCards.splice(newPosition, 0, { ...card, list: newListId });
            return [...newCards];
          }
          const newCards = [...prevCards];
          newCards.splice(newPosition, 0, { ...card, list: newListId });
          console.log("ListCards: Added card to destination list:", {
            listId,
            cardId: card._id,
            newCards,
          });
          return [...newCards];
        });
        setColumns((prevColumns) =>
          prevColumns.map((col) =>
            col._id === newListId
              ? {
                ...col,
                cards: col.cards.some((c) => c._id === card._id)
                  ? col.cards.filter((c) => c._id !== card._id)
                  : [
                    ...col.cards.slice(0, newPosition),
                    { ...card, list: newListId },
                    ...col.cards.slice(newPosition),
                  ],
              }
              : col
          )
        );
      }
      toast.info("Thẻ đã được di chuyển!");
    };

    const handleCardCreated = ({ listId: updatedListId, card }) => {
      if (updatedListId !== listId) return;
      console.log("ListCards: Received card-created:", {
        listId,
        cardId: card._id,
      });
      setCards((prevCards) => {
        if (prevCards.some((c) => c._id === card._id)) {
          console.warn("ListCards: Card already exists:", card._id);
          return prevCards;
        }
        return [...prevCards, card];
      });
      setColumns((prevColumns) =>
        prevColumns.map((col) =>
          col._id === listId
            ? {
              ...col,
              cards: col.cards.some((c) => c._id === card._id)
                ? col.cards
                : [...col.cards, card],
            }
            : col
        )
      );
      toast.info("Thẻ mới đã được thêm!");
    };

    socket.on("card-order-updated", handleCardOrderUpdated);
    socket.on("card-moved", handleCardMoved);
    socket.on("card-created", handleCardCreated);

    return () => {
      socket.off("card-order-updated", handleCardOrderUpdated);
      socket.off("card-moved", handleCardMoved);
      socket.off("card-created", handleCardCreated);
      socket.emit("leave-board", { boardId });
      console.log("ListCards: Emitted leave-board:", { boardId });
    };
  }, [socket, socketReady, listId, boardId, setColumns, fetchCards]);

  const sortableItems = useMemo(() => {
    const uniqueCards = cards?.filter(
      (card, index, self) => self.findIndex((c) => c._id === card._id) === index
    );
    return uniqueCards?.map((c) => c._id) || [];
  }, [cards]);

  const renderCards = useCallback(() => {
    const result = [];
    cards.forEach((card, index) => {
      if (
        predictedPosition &&
        predictedPosition.listId === listId &&
        predictedPosition.index === index
      ) {
        result.push(
          <Box
            key="placeholder"
            sx={{
              height: "120px",
              bgcolor: isDarkMode
                ? "rgba(255,255,255,0.15)"
                : theme.palette.grey[200],
              borderRadius: "8px",
              border: `2px dashed ${isDarkMode ? "#888" : theme.palette.grey[500]
                }`,
              opacity: 0.7,
              transition: "all 0.2s ease",
              transform: isOver ? "scale(1.02)" : "scale(1)",
              boxShadow: isOver ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
            }}
          />
        );
      }
      result.push(
        <Cards
          key={card._id}
          card={{ ...card, type: "Card" }}
          setCards={setCards}
          setColumns={setColumns}
          boardMembers={boardMembers}
          setBoardMembers={setBoardMembers}
          boardId={boardId}
          columnId={listId}
        />
      );
    });

    if (
      predictedPosition &&
      predictedPosition.listId === listId &&
      predictedPosition.index === cards.length
    ) {
      result.push(
        <Box
          key="placeholder-end"
          sx={{
            height: "120px",
            bgcolor: isDarkMode
              ? "rgba(255,255,255,0.15)"
              : theme.palette.grey[200],
            borderRadius: "8px",
            border: `2px dashed ${isDarkMode ? "#888" : theme.palette.grey[500]
              }`,
            opacity: 0.7,
            transition: "all 0.2s ease",
            transform: isOver ? "scale(1.02)" : "scale(1)",
            boxShadow: isOver ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
          }}
        />
      );
    }

    return result;
  }, [
    cards,
    predictedPosition,
    listId,
    isDarkMode,
    theme,
    isOver,
    boardMembers,
    setBoardMembers,
    boardId,
    setCards,
    setColumns,
  ]);

  return (
    <Box
      ref={setNodeRef}
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        overflowX: "hidden",
        flexGrow: 1,
        bgcolor: isOver
          ? isDarkMode
            ? "rgba(255,255,255,0.08)"
            : theme.palette.grey[100]
          : "transparent",
        borderRadius: "12px",
        minHeight: "120px",
        transition:
          "background-color 0.2s ease, border 0.2s ease, transform 0.2s ease",
        border: isOver
          ? `2px dashed ${isDarkMode ? "#777" : theme.palette.grey[400]}`
          : "none",
        transform: isOver ? "scale(1.01)" : "scale(1)",
        "&:hover": {
          bgcolor: isDarkMode
            ? "rgba(255,255,255,0.05)"
            : theme.palette.grey[50],
        },
      }}
    >
      <SortableContext
        items={sortableItems}
        strategy={verticalListSortingStrategy}
      >
        {cards?.length > 0 || predictedPosition?.listId === listId ? (
          renderCards()
        ) : (
          <Box
            sx={{
              p: 2,
              color: isDarkMode
                ? theme.palette.grey[400]
                : theme.palette.text.secondary,
              bgcolor: isDarkMode
                ? "rgba(255,255,255,0.05)"
                : theme.palette.grey[100],
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
