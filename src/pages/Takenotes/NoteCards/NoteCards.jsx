import React, { useState } from "react";
import { Card, CardContent, Typography, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTheme } from "@mui/material/styles";

const NoteCard = ({ note, onDelete }) => {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false); // State kiểm tra hover

  // Màu nền & chữ theo Dark Mode
  const backgroundColor = theme.palette.mode === "dark" ? "#222" : "#f4f4f4";
  const textColor = theme.palette.mode === "dark" ? "#fff" : "#000";

  return (
    <Card
      sx={{
        backgroundColor,
        color: textColor,
        p: 1,
        position: "relative",
        transition: "all 0.3s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <CardContent
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="body1">{note.text}</Typography>
        {hovered && ( // 🔥 Chỉ hiện khi hover
          <IconButton
            onClick={() => onDelete(note.id)}
            color="error"
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        )}
      </CardContent>
    </Card>
  );
};

export default NoteCard;
