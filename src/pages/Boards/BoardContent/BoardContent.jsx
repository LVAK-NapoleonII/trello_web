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
} from "@dnd-kit/core";
import { mapOrder } from "../../../utils/softs.js";
import { useEffect, useState } from "react";
import Column from "./ListColumns/Column/Column.jsx";
import Cards from "./ListColumns/Column/ListCards/Cards/Cards.jsx";
import { cloneDeep } from "lodash";

const ACTIVE_DRAG_ITEM_TYPE = {
  COLUMN: "ACTIVE_DRAG_ITEM_TYPE_COLUMN",
  CARD: "ACTIVE_DRAG_ITEM_TYPE_CARD",
};
function BoardContent({ board }) {
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraints: { distance: 10 },
  });
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraints: { distance: 10 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraints: { delay: 250, tolerance: 500 },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const handldeDragStart = (event) => {
    // console.log("handleDragStart: ", event);
    setActiveDragItemId(event?.active?._id);
    setActiveDragItemType(
      event?.active?.data?.current?.columnId
        ? ACTIVE_DRAG_ITEM_TYPE.CARD
        : ACTIVE_DRAG_ITEM_TYPE.COLUMN
    );
    setActiveDragItemData(event?.active?.data?.current);
  };

  //trigger trong quá trình kéo một phần tử
  const handleDragOver = (event) => {
    // console.log("handleDragOver: ", event);
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) return;
    //kéo card giữa các column
    const { active, over } = event;
    if (!active || !over) return;

    // activeDranggingCard là card đang được kéo
    const {
      id: activeDraggingCardId,
      data: { current: activeDragItemData },
    } = active;
    // over là card đang tương tác với card được kéo
    const { id: overCardId } = over;

    const activeColumn = findColumnByCardId(activeDraggingCardId);
    const overColumn = findColumnByCardId(overCardId);
    //không tồn tại một trong 2 thì không thực hiện hành động, crash web
    if (!activeColumn || !overColumn) return;

    if (activeColumn._id !== overColumn._id) {
      setOrderedColumnsState((prevColums) => {
        const overCardIndex = overColumn?.cards?.findIndex(
          (card) => card._id === overCardId
        );
        let newCardIndex;
        const isBelowOverItem =
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        newCardIndex =
          overCardIndex >= 0
            ? overCardIndex + modifier
            : overColumn?.cards?.lenght + 1;

        const nextColumns = cloneDeep(prevColums);

        const nextActiveColumns = nextColumns.find(
          (column) => column._id === activeColumn._id
        );
        const nextOverColumns = nextColumns.find(
          (column) => column._id === overColumn._id
        );

        if (nextActiveColumns) {
          nextActiveColumns.cards = nextActiveColumns.cards.filter(
            (card) => card._id !== activeDraggingCardId
          );
          nextActiveColumns.cardOrderIds = nextActiveColumns.card.map(
            (card) => card._id
          );
        }

        if (nextOverColumns) {
          // nextOverColumns.cards.splice(newCardIndex, 0, activeDraggingCardId);
        }

        return nextColumns;
      });
    }
  };

  const handleDragEnd = (event) => {
    // console.log("handleDragEnd: ", event);
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) {
      return;
    }
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      const newColumnOrderIds = [...board.columnOrderIds];
      const activeColumnIndex = newColumnOrderIds.indexOf(active.id);
      const overColumnIndex = newColumnOrderIds.indexOf(over.id);
      newColumnOrderIds.splice(activeColumnIndex, 1);
      newColumnOrderIds.splice(overColumnIndex, 0, active.id);
      board.columnOrderIds = newColumnOrderIds;
      setOrderedColumnsState(
        mapOrder(board?.columns, newColumnOrderIds, "_id")
      );
    }
    setActiveDragItemId(null);
    setActiveDragItemType(null);
    setActiveDragItemData(null);
  };

  const orderedColumns = mapOrder(board?.columns, board?.columnOrderIds, "_id");
  const [orderedColumnsState, setOrderedColumnsState] = useState([]);
  const [activeDragItemId, setActiveDragItemId] = useState([null]);
  const [activeDragItemType, setActiveDragItemType] = useState([null]);
  const [activeDragItemData, setActiveDragItemData] = useState([null]);

  useEffect(() => {
    setOrderedColumnsState(orderedColumns);
  }, [board]);

  const findColumnByCardId = (cardId) => {
    return orderedColumns.find((column) =>
      column?.cards?.map((card) => card._id)?.includes(cardId)
    );
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          Opacity: "0.5",
        },
      },
    }),
  };

  return (
    <DndContext
      onDragStart={handldeDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      sensors={sensors}
    >
      <Box
        sx={{
          width: "100%",
          height: (theme) => theme.trelloCustom.boardContentHeight,
          display: "flex",
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "#34495e" : "#1976d2",
          p: "10px 0",
        }}
      >
        <ListColumns columns={orderedColumnsState} />
        <DragOverlay dropAnimation={dropAnimation}>
          {!activeDragItemType && null}
          {activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN && (
            <Column column={activeDragItemData} />
          )}
          {activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD && (
            <Cards card={activeDragItemData} />
          )}
        </DragOverlay>
      </Box>
    </DndContext>
  );
}

export default BoardContent;
