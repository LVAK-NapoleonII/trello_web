import React, { useState } from "react";
import {
  Paper,
  TextField,
  Button,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import NoteCard from "./NoteCards/NoteCards";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import NoteIcon from "@mui/icons-material/Note";
import CloseIcon from "@mui/icons-material/Close"; // 🔥 Thêm icon Xóa

const Takenotes = ({ position, notes, onAddNote, onDeleteNote, onClose }) => {
  const theme = useTheme();
  const [newNote, setNewNote] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: position.x, y: position.y });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(true);
  const [hovered, setHovered] = useState(false); // 🔥 Kiểm tra hover

  // Khi bắt đầu kéo
  const handleMouseDown = (e) => {
    if (e.target.tagName === "BUTTON") return; // Chặn kéo nếu click vào nút bấm
    setIsDragging(true);
    setOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  // Khi di chuyển chuột
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  // Khi thả chuột
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Toggle thu nhỏ/mở rộng khi nhấn vào tiêu đề
  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };

  // Màu nền theo Dark Mode
  const backgroundColor = theme.palette.mode === "dark" ? "#333" : "#fff";
  const textColor = theme.palette.mode === "dark" ? "#fff" : "#000";

  return (
    <div
      style={{
        position: "absolute",
        top: pos.y,
        left: pos.x,
        zIndex: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Paper
        sx={{
          padding: isMinimized ? "5px" : "10px",
          background: backgroundColor,
          color: textColor,
          boxShadow: "0px 0px 10px rgba(0,0,0,0.2)",
          minWidth: isMinimized ? "50px" : "250px",
          cursor: isDragging ? "grabbing" : "grab",
          transition: "all 0.3s ease-in-out",
          position: "relative",
          "&:hover .delete-button": { opacity: 1 }, // 🔥 Hiển thị nút xóa khi hover
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Header để kéo thả + Nhấn để mở rộng */}
        <div
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={toggleMinimized} // Nhấn vào chữ "Take Notes" để mở rộng
          style={{
            cursor: "pointer", // Cảm giác click tốt hơn
            padding: "5px",
            background: theme.palette.mode === "dark" ? "#444" : "#ddd",
            fontWeight: "bold",
            userSelect: "none",
            color: textColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <Typography sx={{ flex: 1, textAlign: "center" }}>
            📝 Take Notes
          </Typography>
          <IconButton size="small" onClick={toggleMinimized}>
            {isMinimized ? (
              <NoteIcon sx={{ color: textColor }} />
            ) : (
              <ExpandMoreIcon sx={{ color: textColor }} />
            )}
          </IconButton>

          {/* 🔥 Nút Xóa giống NoteCard (Ẩn khi không hover) */}
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              position: "absolute",
              right: "5px", // 🔥 Căn vào góc phải bên trong
              opacity: hovered ? 1 : 0, // Ẩn mặc định, hover vào mới hiện
              transition: "opacity 0.3s ease-in-out",
              color: "red",
              backgroundColor: "#444",
              borderRadius: "5px",
              "&:hover": { backgroundColor: "#666" },
            }}
          >
            <CloseIcon />
          </IconButton>
        </div>

        {/* Nội dung ghi chú khi mở rộng */}
        {!isMinimized && (
          <>
            <TextField
              label="Nhập ghi chú..."
              variant="outlined"
              fullWidth
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onAddNote(newNote);
                  setNewNote(""); // Xóa nội dung sau khi thêm
                }
              }}
              InputProps={{
                style: { color: textColor },
              }}
            />

            <Button
              sx={{ mt: 1 }}
              variant="contained"
              onClick={() => {
                onAddNote(newNote);
                setNewNote(""); // Xóa nội dung sau khi thêm
              }}
            >
              Thêm
            </Button>

            <Button sx={{ mt: 1, ml: 1 }} variant="outlined" onClick={onClose}>
              Đóng
            </Button>

            <Grid container spacing={1} sx={{ mt: 2 }}>
              {notes.map((note) => (
                <Grid item xs={12} key={note.id}>
                  <NoteCard note={note} onDelete={onDeleteNote} />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Paper>
    </div>
  );
};

export default Takenotes;
