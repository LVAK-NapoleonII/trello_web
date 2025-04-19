import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@mui/material";
import CardCover from "./CardCover";
import CardHeader from "./CardHeader";
import CardDetails from "./CardDetails";
import CardActionsPanel from "./CardActionsPanel";

function CardContainer({
  card,
  setCards,
  setColumns,
  boardMembers,
  setBoardMembers,
}) {
  const [expanded, setExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card._id,
    data: { ...card, type: "Card" },
  });

  const dndKitCardStyles = {
    touchAction: "none",
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    border: isDragging
      ? "2px solid"
      : card.completed
      ? "2px solid"
      : "1px solid",
    borderColor: isDragging
      ? (theme) => theme.palette.success.main
      : card.completed
      ? (theme) => theme.palette.success.main
      : (theme) => theme.palette.divider,
  };

  return (
    <Card
      ref={setNodeRef}
      style={dndKitCardStyles}
      {...attributes}
      {...listeners}
      sx={{
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        borderRadius: 2,
        bgcolor: (theme) => theme.palette.background.paper,
        position: "relative",
        height: expanded ? "auto" : "120px",
        maxHeight: expanded ? "600px" : "120px",
        width: "100%",
        overflow: "hidden",
        transition: "all 0.2s ease-in-out",
        "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
      }}
    >
      <CardCover cover={card?.cover} />
      <CardHeader
        card={card}
        setCards={setCards}
        setColumns={setColumns}
        setExpanded={setExpanded}
      />
      <CardDetails
        card={card}
        setCards={setCards}
        setColumns={setColumns}
        expanded={expanded}
        setExpanded={setExpanded}
        boardMembers={boardMembers}
        setBoardMembers={setBoardMembers}
      />
      <CardActionsPanel
        card={card}
        setCards={setCards}
        setColumns={setColumns}
        boardMembers={boardMembers}
        setBoardMembers={setBoardMembers}
      />
    </Card>
  );
}

export default CardContainer;
