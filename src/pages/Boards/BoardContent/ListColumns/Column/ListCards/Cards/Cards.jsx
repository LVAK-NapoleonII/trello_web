import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Groups3Icon from "@mui/icons-material/Groups3";
import AssistantIcon from "@mui/icons-material/Assistant";
import AttachmentIcon from "@mui/icons-material/Attachment";

import { Button, Typography } from "@mui/material";

function Cards({ temporaryHideMedia }) {
  if (temporaryHideMedia) {
    return (
      <Card
        sx={{
          cursor: "pointer",
          boxShadow: "0 1px 1px grpa(0,0,0.2)",
          overflow: "unset",
        }}
      >
        <CardContent sx={{ p: "1.5", "&:last-child": { p: 1.5 } }}>
          <Typography>~LVAK~</Typography>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card
      sx={{
        cursor: "pointer",
        boxShadow: "0 1px 1px grpa(0,0,0.2)",
        overflow: "unset",
      }}
    >
      <CardMedia
        sx={{ height: 140 }}
        image="https://th.bing.com/th/id/OIP.IgKA0VTzX8YgGULq39huzgHaDb?rs=1&pid=ImgDetMain"
        title="green iguana"
      />
      <CardContent sx={{ p: "1.5", "&:last-child": { p: 1.5 } }}>
        <Typography>~LVAK~</Typography>
      </CardContent>
      <CardActions sx={{ p: "0 4px 8px 4px" }}>
        <Button size="small" startIcon={<Groups3Icon />}>
          20
        </Button>
        <Button size="small" startIcon={<AssistantIcon />}>
          15
        </Button>
        <Button size="small" startIcon={<AttachmentIcon />}>
          10
        </Button>
      </CardActions>
    </Card>
  );
}

export default Cards;
