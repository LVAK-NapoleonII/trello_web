import { useEffect, useState, useContext, useCallback, useMemo } from "react";
import Cards from "./Cards/Cards";
import Box from "@mui/material/Box";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
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
}) {
  const { socket } = useContext(SocketContext);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [cards, setCards] = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [socketReady, setSocketReady] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  useEffect(() => {
    if (!socket) {
      console.warn("Socket not available in ListCards");
      return;
    }

    socket.on("connect", () => {
      console.log("ListCards: Socket connected");
      setSocketReady(true);
    });

    socket.on("connect_error", (err) => {
      console.error("ListCards: Socket error:", err.message);
      toast.error("Lỗi kết nối server!");
      setSocketReady(false);
    });

    socket.on("card-order-updated", ({ listId: updatedListId, cardOrder }) => {
      if (updatedListId === listId) {
        setCards((prevCards) => {
          const reorderedCards = cardOrder
            .map((id) => prevCards.find((card) => card._id === id))
            .filter((card) => card);
          return reorderedCards;
        });
      }
    });

    socket.on("card-moved", ({ card, oldListId, newListId }) => {
      if (oldListId === listId) {
        setCards((prevCards) => prevCards.filter((c) => c._id !== card._id));
      } else if (newListId === listId) {
        setCards((prevCards) => [...prevCards, card]);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("card-order-updated");
      socket.off("card-moved");
    };
  }, [socket, listId]);

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
      setCards(response.data);
    } catch (err) {
      console.error("Error fetching cards:", err.response?.data || err.message);
      toast.error(
        `Có lỗi xảy ra khi lấy danh sách thẻ: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  }, [listId]);

  useEffect(() => {
    if (!listId) {
      console.error("listId is undefined or null.");
      return;
    }
    fetchCards();
  }, [listId, refresh, fetchCards]);

  const handleDragStart = (event) => {
    const { active } = event;
    const draggedCard = cards.find((c) => c._id === active.id);
    setActiveCard(draggedCard);
    console.log("Drag started:", {
      cardId: active.id,
      cardTitle: draggedCard?.title,
      timestamp: new Date().toISOString(),
    });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over || active.id === over.id) return;

    const oldIndex = cards.findIndex((c) => c._id === active.id);
    const newIndex = cards.findIndex((c) => c._id === over.id);

    const newCards = arrayMove(cards, oldIndex, newIndex);
    setCards(newCards);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token! Vui lòng đăng nhập lại.");
      }
      const cardOrder = newCards.map((card) => card._id);
      console.log("Sending cardOrder to server:", {
        listId,
        cardOrder: JSON.stringify(cardOrder),
        timestamp: new Date().toISOString(),
      });
      await axios.put(
        `http://localhost:5000/api/lists/card-order/${listId}`,
        { cardOrder },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setColumns((prevColumns) =>
        prevColumns.map((col) =>
          col._id === listId ? { ...col, cards: newCards } : col
        )
      );

      if (socket && socketReady) {
        socket.emit("card-order-updated", {
          listId,
          cardOrder,
        });
        console.log("Emitted card-order-updated:", { listId, cardOrder });
      } else {
        console.warn("Socket not ready, skipping emit");
      }
    } catch (err) {
      console.error("Error updating card order:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      toast.error(
        `Có lỗi xảy ra khi cập nhật thứ tự thẻ: ${
          err.response?.data?.message || err.message
        }`
      );
      fetchCards();
    }
  };

  const sortableItems = useMemo(() => cards?.map((c) => c._id) || [], [cards]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortableItems}
        strategy={verticalListSortingStrategy}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            overflowX: "hidden",
            flexGrow: 1,
          }}
        >
          {cards?.length > 0 ? (
            cards.map((card) => (
              <Cards
                key={card._id}
                card={{ ...card, type: "Card" }}
                setCards={setCards}
                setColumns={setColumns}
                isDragging={activeCard?._id === card._id}
                boardMembers={boardMembers} // Truyền boardMembers
                setBoardMembers={setBoardMembers} // Truyền setBoardMembers
              />
            ))
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
              }}
            >
              Không có thẻ nào trong cột này.
            </Box>
          )}
        </Box>
        <DragOverlay>
          {activeCard && (
            <Box
              sx={{
                bgcolor: isDarkMode ? "#3a3a50" : "#fff",
                borderRadius: "12px",
                boxShadow: isDarkMode
                  ? "0 6px 16px rgba(0,0,0,0.5)"
                  : theme.shadows[5],
                opacity: 0.9,
                transform: "scale(1.05)",
                transition: "transform 0.2s ease, opacity 0.2s ease",
                p: 2,
                cursor: "grabbing",
              }}
            >
              <Cards
                card={{ ...activeCard, type: "Card" }}
                setCards={setCards}
                setColumns={setColumns}
                isDragging={true}
                boardMembers={boardMembers} // Truyền boardMembers
                setBoardMembers={setBoardMembers} // Truyền setBoardMembers
              />
            </Box>
          )}
        </DragOverlay>
      </SortableContext>
    </DndContext>
  );
}

export default ListCards;
