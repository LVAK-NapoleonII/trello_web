import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Groups3Icon from "@mui/icons-material/Groups3";
import AssistantIcon from "@mui/icons-material/Assistant";
import AttachmentIcon from "@mui/icons-material/Attachment";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { Button, Typography } from "@mui/material";

function Cards({ card }) {
  const shouldShowCardActions = () => {
    return (
      card?.memberIds?.length > 0 ||
      card?.commens?.length > 0 ||
      card?.attachments?.length > 0
    );
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card._id,
    data: { ...card },
  });

  const dndKitCardStyles = {
    touchAction: "none",
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    border: isDragging ? "2px solid #2ecc71" : undefined,
  };

  return (
    <Card
      ref={setNodeRef}
      style={dndKitCardStyles}
      {...attributes}
      {...listeners}
      sx={{
        cursor: "pointer",
        boxShadow: "0 1px 1px grpa(0,0,0.2)",
        overflow: "unset",
      }}
    >
      {card?.cover && (
        <CardMedia
          sx={{ height: 140 }}
          image={card?.cover}
          title="green iguana"
        />
      )}

      <CardContent sx={{ p: "1.5", "&:last-child": { p: 1.5 } }}>
        <Typography>{card?.title}</Typography>
      </CardContent>
      {shouldShowCardActions() && (
        <CardActions sx={{ p: "0 4px 8px 4px" }}>
          {!!card?.memberIds?.length && (
            <Button size="small" startIcon={<Groups3Icon />}>
              {card?.memberIds?.length}
            </Button>
          )}
          {!!card?.commens?.length && (
            <Button size="small" startIcon={<AssistantIcon />}>
              {card?.commens?.length}
            </Button>
          )}
          {!!card?.attachments?.length && (
            <Button size="small" startIcon={<AttachmentIcon />}>
              {card?.attachments?.length}
            </Button>
          )}
        </CardActions>
      )}
    </Card>
  );
}

export default Cards;
