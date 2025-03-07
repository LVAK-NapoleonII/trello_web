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
import { Opacity } from "@mui/icons-material";

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

  const handleDragEnd = (event) => {
    // console.log("handleDragEnd: ", event);
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const newColumnOrderIds = [...board.columnOrderIds];
      const activeColumnIndex = newColumnOrderIds.indexOf(active.id);
      const overColumnIndex = newColumnOrderIds.indexOf(over.id);
      newColumnOrderIds.splice(activeColumnIndex, 1);
      newColumnOrderIds.splice(overColumnIndex, 0, active.id);
      board.columnOrderIds = newColumnOrderIds;
      setorderColumnsState(mapOrder(board?.columns, newColumnOrderIds, "_id"));
    }
    setActiveDragItemId(null);
    setActiveDragItemType(null);
    setActiveDragItemData(null);
  };

  const orderedColumns = mapOrder(board?.columns, board?.columnOrderIds, "_id");
  const [orderedColumnsState, setorderColumnsState] = useState([]);
  const [activeDragItemId, setActiveDragItemId] = useState([null]);
  const [activeDragItemType, setActiveDragItemType] = useState([null]);
  const [activeDragItemData, setActiveDragItemData] = useState([null]);
  useEffect(() => {
    setorderColumnsState(orderedColumns);
  }, [board]);

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
      onDragEnd={handleDragEnd}
      sensors={sensors}
      onDragStart={handldeDragStart}
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
