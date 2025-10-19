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

      let uniqueCards = response.data.filter(
        (card, index, self) =>
          self.findIndex((c) => c._id === card._id) === index
      );

      uniqueCards = uniqueCards.sort((a, b) => a.position - b.position);

      setCards(uniqueCards);
      setColumns((prevColumns) =>
        prevColumns.map((col) =>
          col._id === listId
            ? {
              ...col,
              cards: uniqueCards,
              cardOrderIds: uniqueCards.map((c) => c._id),
            }
            : col
        )
      );
    } catch (err) {
      console.error("ListCards: Error fetching cards:", err);
      toast.error(
        `Lỗi khi tải danh sách thẻ: ${err.response?.data?.message || err.message}`
      );
    }
  }, [listId, setColumns]);

  useEffect(() => {
    if (!listId) return;
    fetchCards();
  }, [listId, refresh, fetchCards]);

  useEffect(() => {
    if (!socket || !socketReady || !boardId) return;

    socket.emit("join-board", { boardId });

    // ✅ FIX: Cập nhật đúng thứ tự từ backend
    const handleCardOrderUpdated = ({ listId: updatedListId, cardOrder }) => {
      if (updatedListId !== listId) return;

      if (!Array.isArray(cardOrder)) {
        console.error("ListCards: Invalid cardOrder:", cardOrder);
        fetchCards();
        return;
      }

      console.log("ListCards: Received card-order-updated:", {
        listId: updatedListId,
        cardOrder,
      });

      // ✅ QUAN TRỌNG: Kiểm tra xem có card nào bị thiếu không
      setCards((prevCards) => {
        const missingIds = cardOrder.filter(
          (id) => !prevCards.some((card) => card._id === id)
        );

        if (missingIds.length > 0) {
          console.warn("ListCards: Missing cards, refetching:", missingIds);
          fetchCards();
          return prevCards;
        }

        // ✅ Sắp xếp lại cards theo cardOrder từ backend
        const reorderedCards = cardOrder
          .map((id) => prevCards.find((card) => card._id === id))
          .filter((card) => card !== undefined)
          .map((card, index) => ({
            ...card,
            position: index // Cập nhật position theo index mới
          }));

        console.log("ListCards: Reordered cards:", {
          oldOrder: prevCards.map(c => c._id),
          newOrder: reorderedCards.map(c => c._id),
        });

        return reorderedCards;
      });

      // ✅ Cập nhật columns state
      setColumns((prevColumns) =>
        prevColumns.map((col) =>
          col._id === listId
            ? {
              ...col,
              cardOrderIds: cardOrder,
              cards: cardOrder
                .map((id) => col.cards.find((card) => card._id === id))
                .filter((card) => card !== undefined)
                .map((card, index) => ({ ...card, position: index })),
            }
            : col
        )
      );
    };

    // ✅ FIX: Xử lý card-moved chính xác
    const handleCardMoved = ({ card, oldListId, newListId, newPosition }) => {
      console.log("ListCards: Received card-moved:", {
        cardId: card._id,
        oldListId,
        newListId,
        newPosition,
        currentListId: listId,
      });

      // Xóa khỏi list cũ
      if (oldListId === listId) {
        setCards((prevCards) => {
          const filtered = prevCards.filter((c) => c._id !== card._id);
          console.log("ListCards: Removed card from old list:", {
            cardId: card._id,
            remainingCards: filtered.map(c => c._id),
          });
          return filtered;
        });

        setColumns((prevColumns) =>
          prevColumns.map((col) =>
            col._id === listId
              ? {
                ...col,
                cards: col.cards.filter((c) => c._id !== card._id),
                cardOrderIds: col.cards
                  .filter((c) => c._id !== card._id)
                  .map((c) => c._id),
              }
              : col
          )
        );
      }

      // Thêm vào list mới
      if (newListId === listId) {
        setCards((prevCards) => {
          // Loại bỏ duplicate nếu có
          const filtered = prevCards.filter((c) => c._id !== card._id);

          // ✅ QUAN TRỌNG: Insert vào đúng vị trí
          const newCards = [...filtered];
          const safePosition = Math.min(newPosition, newCards.length);
          newCards.splice(safePosition, 0, {
            ...card,
            list: newListId,
            position: safePosition
          });

          console.log("ListCards: Added card to new list:", {
            cardId: card._id,
            position: safePosition,
            newOrder: newCards.map(c => c._id),
          });

          return newCards;
        });

        setColumns((prevColumns) =>
          prevColumns.map((col) => {
            if (col._id === newListId) {
              // Loại bỏ duplicate
              const filtered = col.cards.filter((c) => c._id !== card._id);

              // Insert vào đúng vị trí
              const newCards = [...filtered];
              const safePosition = Math.min(newPosition, newCards.length);
              newCards.splice(safePosition, 0, {
                ...card,
                list: newListId,
                position: safePosition
              });

              return {
                ...col,
                cards: newCards,
                cardOrderIds: newCards.map((c) => c._id),
              };
            }
            return col;
          })
        );
      }
    };

    const handleCardCreated = ({ listId: updatedListId, card }) => {
      if (updatedListId !== listId) return;

      setCards((prevCards) => {
        if (prevCards.some((c) => c._id === card._id)) {
          console.log("ListCards: Card already exists, skipping:", card._id);
          return prevCards;
        }
        return [...prevCards, { ...card, position: prevCards.length }];
      });

      setColumns((prevColumns) =>
        prevColumns.map((col) =>
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
  }, [socket, socketReady, listId, boardId, setColumns, fetchCards]);

  const sortableItems = useMemo(() => {
    const uniqueCards = cards?.filter(
      (card, index, self) => self.findIndex((c) => c._id === card._id) === index
    );
    return uniqueCards?.map((c) => c._id) || [];
  }, [cards]);

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

    cards.forEach((card, index) => {
      result.push(renderPlaceholder(index));

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

    result.push(renderPlaceholder(cards.length));

    return result;
  }, [
    cards,
    predictedPosition,
    listId,
    isDarkMode,
    boardMembers,
    setBoardMembers,
    boardId,
    setCards,
    setColumns,
    renderPlaceholder,
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