import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PeopleIcon from "@mui/icons-material/People";
import LockIcon from "@mui/icons-material/Lock";
import { useMemo } from "react";

// 🖌 Hàm kiểm tra màu sáng hay tối để đổi màu chữ cho phù hợp
const isDarkColor = (hexColor) => {
  if (!hexColor) return false;
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 140; // Nếu sáng yếu thì coi là màu tối
};

const BoardItem = ({ board }) => {
  const navigate = useNavigate();
  const textColor = useMemo(
    () => (isDarkColor(board.color) ? "#fff" : "#333"),
    [board.color]
  );

  return (
    <Box
      sx={{
        bgcolor: board.color || "#0984e3",
        p: 2.5,
        borderRadius: 3,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "160px",
        boxShadow: 3,
        position: "relative",
        transition: "transform 0.2s ease, opacity 0.3s ease",
        "&:hover": {
          transform: "scale(1.05)",
          opacity: 0.9,
        },
      }}
      onClick={() => navigate(`/boards/${board._id}`)}
    >
      {/* Tiêu đề Board */}
      <Typography
        variant="h6"
        fontWeight="bold"
        sx={{
          color: textColor,
          wordWrap: "break-word",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
          overflow: "hidden",
        }}
      >
        {board.title}
      </Typography>

      {/* Mô tả ngắn */}
      {board.description && (
        <Typography
          variant="body2"
          sx={{
            color: textColor,
            opacity: 0.8,
            fontSize: "0.85rem",
            mt: 0.5,
            wordWrap: "break-word",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
          }}
        >
          {board.description}
        </Typography>
      )}

      {/* Thông tin loại board (Public/Private) */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
        <Tooltip
          title={board.type === "public" ? "Public Board" : "Private Board"}
        >
          {board.type === "public" ? (
            <PeopleIcon sx={{ color: textColor, fontSize: 20 }} />
          ) : (
            <LockIcon sx={{ color: textColor, fontSize: 20 }} />
          )}
        </Tooltip>
        <Typography variant="caption" sx={{ color: textColor, opacity: 0.8 }}>
          {board.type === "public" ? "Public" : "Private"}
        </Typography>
      </Box>

      {/* Nút xem chi tiết */}
      <IconButton
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          color: textColor,
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.4)",
          },
        }}
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/boards/${board._id}`);
        }}
      >
        <VisibilityIcon />
      </IconButton>
    </Box>
  );
};

export default BoardItem;
