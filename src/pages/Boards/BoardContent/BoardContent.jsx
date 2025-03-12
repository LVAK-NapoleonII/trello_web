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
import { useEffect, useState } from "react";
import Column from "./ListColumns/Column/Column.jsx";
import Cards from "./ListColumns/Column/ListCards/Cards/Cards.jsx";
import { cloneDeep } from "lodash";
import { arrayMove } from "@dnd-kit/sortable";

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

  const orderedColumns = mapOrder(board?.columns, board?.columnOrderIds, "_id");
  const [orderedColumnsState, setOrderedColumnsState] = useState([]);
  const [activeDragItemId, setActiveDragItemId] = useState([null]);
  const [activeDragItemType, setActiveDragItemType] = useState([null]);
  const [activeDragItemData, setActiveDragItemData] = useState([null]);
  const [oldColumn, setOldColumn] = useState([null]);

  const handldeDragStart = (event) => {
    // console.log("handleDragStart: ", event);
    setActiveDragItemId(event?.active?._id);
    setActiveDragItemType(
      event?.active?.data?.current?.columnId
        ? ACTIVE_DRAG_ITEM_TYPE.CARD
        : ACTIVE_DRAG_ITEM_TYPE.COLUMN
    );
    setActiveDragItemData(event?.active?.data?.current);

    if (event?.active?.data?.current?.columnId) {
      setOldColumn(findColumnByCardId(event?.active?.id));
    }
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
            : overColumn?.cards?.length;

        const nextColumns = cloneDeep(prevColums);

        const nextActiveColumns = nextColumns.find(
          (column) => column._id === activeColumn._id
        );
        const nextOverColumns = nextColumns.find(
          (column) => column._id === overColumn._id
        );
        //column cũ
        if (nextActiveColumns) {
          //xóa card khi di chuyển khỏi column cũ
          nextActiveColumns.cards = nextActiveColumns.cards.filter(
            (card) => card._id !== activeDraggingCardId
          );
          //cập nhật lại column
          nextActiveColumns.cardOrderIds = nextActiveColumns.cards.map(
            (card) => card._id
          );
        }
        // column mới
        if (nextOverColumns) {
          //kiểm tra card kéo có tồn tại chưa, có thì xóa đi
          nextOverColumns.cards = nextOverColumns.cards.filter(
            (card) => card._id !== activeDraggingCardId
          );
          // thêm card mới kéo vào
          nextOverColumns.cards = nextOverColumns.cards.toSpliced(
            newCardIndex,
            0,
            activeDragItemData
          );
          //cập nhật lại column mới
          nextOverColumns.cardOrderIds = nextOverColumns.cards.map(
            (card) => card._id
          );
        }

        return nextColumns;
      });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!active || !over) return;

    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) {
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

      if (oldColumn._id !== overColumn._id) {
        console.log("kéo thả card 2 column khác nhau");
      } else {
        const oldCardIndex = oldColumn?.cards?.findIndex(
          (c) => c._id === activeDraggingCardId
        );
        const newCardIndex = overColumn?.cards?.findIndex(
          (c) => c._id === overCardId
        );
        if (oldCardIndex !== -1 && newCardIndex !== -1) {
          const dndOrderedCards = arrayMove(
            oldColumn?.cards,
            oldCardIndex,
            newCardIndex
          );
          setOrderedColumnsState((prevColumns) => {
            const nextColumns = cloneDeep(prevColumns);
            const targetColumn = nextColumns.find(
              (column) => column._id === overColumn._id
            );
            if (targetColumn) {
              targetColumn.cards = dndOrderedCards;
              targetColumn.cardOrderIds = dndOrderedCards.map(
                (card) => card._id
              );
            }
            return nextColumns;
          });
        }
      }
    }

    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
      if (active.id !== over.id) {
        const oldColumnIndex = orderedColumnsState.findIndex(
          (c) => c._id === active.id
        );
        const newColumnIndex = orderedColumnsState.findIndex(
          (c) => c._id === over.id
        );

        const dndOrderedColumns = arrayMove(
          [...orderedColumnsState],
          oldColumnIndex,
          newColumnIndex
        );
        setOrderedColumnsState(dndOrderedColumns);
      }
    }

    setActiveDragItemId(null);
    setActiveDragItemType(null);
    setActiveDragItemData(null);
    setOldColumn(null);
  };

  useEffect(() => {
    setOrderedColumnsState(orderedColumns);
  }, [board]);

  const findColumnByCardId = (cardId) =>
    orderedColumnsState.find((col) =>
      col.cards.some((card) => card._id === cardId)
    );

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
      collisionDetection={closestCorners}
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
