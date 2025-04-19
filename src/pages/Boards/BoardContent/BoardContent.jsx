import Box from "@mui/material/Box";
import ListColumns from "./ListColumns/ListColumns";
import {
  DndContext,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  closestCorners,
} from "@dnd-kit/core";
import { mapOrder } from "../../../utils/softs.js";
import { useEffect, useState, useCallback, useRef } from "react";
import Column from "./ListColumns/Column/Column.jsx";
import Cards from "./ListColumns/Column/ListCards/Cards/Cards.jsx";
import { cloneDeep } from "lodash";
import { arrayMove } from "@dnd-kit/sortable";
import io from "socket.io-client";
import { toast } from "react-toastify";
import axios from "axios";

const ACTIVE_DRAG_ITEM_TYPE = {
  COLUMN: "ACTIVE_DRAG_ITEM_TYPE_COLUMN",
  CARD: "ACTIVE_DRAG_ITEM_TYPE_CARD",
};

function BoardContent({ board }) {
  const [socket, setSocket] = useState(null);
  const [orderedColumnsState, setOrderedColumnsState] = useState([]);
  const [activeDragItem, setActiveDragItem] = useState(null); // Hợp nhất state
  const lastOverId = useRef(null);

  // Khởi tạo Socket.IO
  useEffect(() => {
    const newSocket = io("http://localhost:5000", { withCredentials: true });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("BoardContent: Socket connected");
      if (board?._id) {
        newSocket.emit("join-board", { boardId: board._id });
      }
    });

    newSocket.on("connect_error", (err) => {
      console.error("BoardContent: Socket error:", err.message);
      toast.error("Lỗi kết nối server!");
    });

    // Lắng nghe sự kiện từ server
    newSocket.on(
      "card-moved",
      ({ card, oldListId, newListId, newPosition }) => {
        setOrderedColumnsState((prev) => {
          const nextColumns = cloneDeep(prev);
          const oldColumn = nextColumns.find((c) => c._id === oldListId);
          const newColumn = nextColumns.find((c) => c._id === newListId);

          if (oldColumn && newColumn) {
            oldColumn.cards = oldColumn.cards.filter((c) => c._id !== card._id);
            oldColumn.cardOrderIds = oldColumn.cards.map((c) => c._id);

            newColumn.cards = newColumn.cards.filter((c) => c._id !== card._id);
            newColumn.cards.splice(newPosition, 0, {
              ...card,
              columnId: newListId,
            });
            newColumn.cardOrderIds = newColumn.cards.map((c) => c._id);
          }

          return nextColumns;
        });
      }
    );

    newSocket.on("card-order-updated", ({ listId, cardOrder }) => {
      setOrderedColumnsState((prev) => {
        const nextColumns = cloneDeep(prev);
        const column = nextColumns.find((c) => c._id === listId);
        if (column) {
          column.cardOrderIds = cardOrder;
          column.cards = mapOrder(column.cards, cardOrder, "_id");
        }
        return nextColumns;
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [board?._id]);

  // Cảm biến kéo thả
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 500 },
    })
  );

  // Khởi tạo danh sách cột
  useEffect(() => {
    const orderedColumns = mapOrder(
      board?.columns,
      board?.columnOrderIds,
      "_id"
    );
    setOrderedColumnsState(orderedColumns);
  }, [board]);

  // Tìm cột chứa thẻ
  const findColumnByCardId = useCallback(
    (cardId) =>
      orderedColumnsState.find((col) =>
        col.cards.some((card) => card._id === cardId)
      ),
    [orderedColumnsState]
  );

  // Di chuyển thẻ giữa các cột
  const moveCardBetweenDifferentColumns = async (
    overColumn,
    overCardId,
    active,
    over,
    activeColumn,
    activeDraggingCardId,
    activeDraggingCardData
  ) => {
    const overCardIndex = overColumn?.cards?.findIndex(
      (card) => card._id === overCardId
    );
    const isBelowOverItem =
      active.rect.current.translated &&
      active.rect.current.translated.top > over.rect.top + over.rect.height;
    const modifier = isBelowOverItem ? 1 : 0;
    const newCardIndex =
      overCardIndex >= 0 ? overCardIndex + modifier : overColumn?.cards?.length;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/cards/${activeDraggingCardId}/move`,
        {
          newListId: overColumn._id,
          newBoardId: board._id,
          newPosition: newCardIndex,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrderedColumnsState((prev) => {
        const nextColumns = cloneDeep(prev);
        const activeCol = nextColumns.find((c) => c._id === activeColumn._id);
        const overCol = nextColumns.find((c) => c._id === overColumn._id);

        if (activeCol) {
          activeCol.cards = activeCol.cards.filter(
            (c) => c._id !== activeDraggingCardId
          );
          activeCol.cardOrderIds = activeCol.cards.map((c) => c._id);
        }

        if (overCol) {
          overCol.cards = overCol.cards.filter(
            (c) => c._id !== activeDraggingCardId
          );
          overCol.cards.splice(newCardIndex, 0, {
            ...activeDraggingCardData,
            columnId: overColumn._id,
          });
          overCol.cardOrderIds = overCol.cards.map((c) => c._id);
        }

        return nextColumns;
      });

      socket.emit("card-moved", {
        card: response.data.card,
        oldListId: activeColumn._id,
        newListId: overColumn._id,
        newPosition: newCardIndex,
      });
    } catch (err) {
      console.error("Error moving card:", err);
      toast.error("Lỗi khi di chuyển thẻ!");
    }
  };

  // Xử lý bắt đầu kéo
  const handleDragStart = useCallback(
    (event) => {
      const { active } = event;
      setActiveDragItem({
        id: active.id,
        type: active.data.current?.columnId
          ? ACTIVE_DRAG_ITEM_TYPE.CARD
          : ACTIVE_DRAG_ITEM_TYPE.COLUMN,
        data: active.data.current,
        oldColumn: active.data.current?.columnId
          ? findColumnByCardId(active.id)
          : null,
      });
    },
    [findColumnByCardId]
  );

  // Xử lý khi kéo qua
  const handleDragOver = useCallback(
    (event) => {
      if (activeDragItem?.type !== ACTIVE_DRAG_ITEM_TYPE.CARD) return;

      const { active, over } = event;
      if (!active || !over) return;

      const activeDraggingCardId = active.id;
      const overCardId = over.id;
      const activeColumn = findColumnByCardId(activeDraggingCardId);
      const overColumn = findColumnByCardId(overCardId);

      if (!activeColumn || !overColumn || activeColumn._id === overColumn._id)
        return;

      moveCardBetweenDifferentColumns(
        overColumn,
        overCardId,
        active,
        over,
        activeColumn,
        activeDraggingCardId,
        activeDragItem.data
      );
    },
    [activeDragItem, findColumnByCardId]
  );

  // Xử lý khi thả
  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      if (!active || !over) return;

      if (activeDragItem.type === ACTIVE_DRAG_ITEM_TYPE.CARD) {
        const activeDraggingCardId = active.id;
        const overCardId = over.id;
        const activeColumn = findColumnByCardId(activeDraggingCardId);
        const overColumn = findColumnByCardId(overCardId);

        if (!activeColumn || !overColumn) return;

        if (activeColumn._id === overColumn._id) {
          const oldCardIndex = activeColumn.cards.findIndex(
            (c) => c._id === activeDraggingCardId
          );
          const newCardIndex = overColumn.cards.findIndex(
            (c) => c._id === overCardId
          );

          if (
            oldCardIndex !== newCardIndex &&
            oldCardIndex !== -1 &&
            newCardIndex !== -1
          ) {
            const dndOrderedCards = arrayMove(
              activeColumn.cards,
              oldCardIndex,
              newCardIndex
            );
            const newCardOrderIds = dndOrderedCards.map((card) => card._id);

            try {
              const token = localStorage.getItem("token");
              await axios.put(
                `http://localhost:5000/api/lists/card-order/${activeColumn._id}`,
                { cardOrder: newCardOrderIds },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              setOrderedColumnsState((prev) => {
                const nextColumns = cloneDeep(prev);
                const targetColumn = nextColumns.find(
                  (c) => c._id === activeColumn._id
                );
                if (targetColumn) {
                  targetColumn.cards = dndOrderedCards;
                  targetColumn.cardOrderIds = newCardOrderIds;
                }
                return nextColumns;
              });

              socket.emit("card-order-updated", {
                listId: activeColumn._id,
                cardOrder: newCardOrderIds,
              });
            } catch (err) {
              console.error("Error updating card order:", err);
              toast.error("Lỗi khi cập nhật thứ tự thẻ!");
            }
          }
        } else {
          await moveCardBetweenDifferentColumns(
            overColumn,
            overCardId,
            active,
            over,
            activeColumn,
            activeDraggingCardId,
            activeDragItem.data
          );
        }
      } else if (activeDragItem.type === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
        if (active.id !== over.id) {
          const oldColumnIndex = orderedColumnsState.findIndex(
            (c) => c._id === active.id
          );
          const newColumnIndex = orderedColumnsState.findIndex(
            (c) => c._id === over.id
          );
          const dndOrderedColumns = arrayMove(
            orderedColumnsState,
            oldColumnIndex,
            newColumnIndex
          );

          try {
            const token = localStorage.getItem("token");
            await axios.put(
              `http://localhost:5000/api/boards/${board._id}/list-order`,
              { listOrder: dndOrderedColumns.map((c) => c._id) },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            setOrderedColumnsState(dndOrderedColumns);
            socket.emit("list-order-updated", {
              boardId: board._id,
              listOrder: dndOrderedColumns.map((c) => c._id),
            });
          } catch (err) {
            console.error("Error updating list order:", err);
            toast.error("Lỗi khi cập nhật thứ tự cột!");
          }
        }
      }

      setActiveDragItem(null);
    },
    [activeDragItem, orderedColumnsState, board._id, socket, findColumnByCardId]
  );

  // Thuật toán phát hiện va chạm
  const collisionDetectionStrategy = useCallback(
    (args) => {
      if (activeDragItem?.type === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
        return closestCorners(args);
      }
      return closestCorners(args); // Đơn giản hóa để cải thiện hiệu suất
    },
    [activeDragItem]
  );

  // Hiệu ứng thả
  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: "0.5" } },
    }),
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <Box
        sx={{
          width: "100%",
          height: (theme) => theme.trelloCustom.boardContentHeight,
          display: "flex",
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "#34495e" : "#1976d2",
          p: "10px 0",
          position: "relative",
          overflowX: "auto",
        }}
      >
        <ListColumns columns={orderedColumnsState} />
        <DragOverlay dropAnimation={dropAnimation}>
          {!activeDragItem && null}
          {activeDragItem?.type === ACTIVE_DRAG_ITEM_TYPE.COLUMN && (
            <Column column={activeDragItem.data} />
          )}
          {activeDragItem?.type === ACTIVE_DRAG_ITEM_TYPE.CARD && (
            <Cards card={activeDragItem.data} />
          )}
        </DragOverlay>
      </Box>
    </DndContext>
  );
}

export default BoardContent;
