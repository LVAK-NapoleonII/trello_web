import Box from "@mui/material/Box";
import ListColumns from "./ListColumns/ListColumns";
import {
  DndContext,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { mapOrder } from "../../../utils/softs.js";
import { useEffect, useState } from "react";
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

  const handleDragEnd = (event) => {
    console.log("handleDragEnd: ", event);
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
  };

  const orderedColumns = mapOrder(board?.columns, board?.columnOrderIds, "_id");
  const [orderedColumnsState, setorderColumnsState] = useState([]);
  useEffect(() => {
    setorderColumnsState(orderedColumns);
  }, [board]);

  return (
    <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
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
      </Box>
    </DndContext>
  );
}

export default BoardContent;
