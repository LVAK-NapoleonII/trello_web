import { useState, useContext, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  InputAdornment,
  Box,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Palette as PaletteIcon,
  Image as ImageIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import axios from "axios";
import { toast } from "react-toastify";
import { SocketContext } from "../../../../../../../context/SocketContext";
import { useTheme } from "@mui/material/styles";

function EditCardDialog({ open, onClose, card, setColumns }) {
  const { socket, socketReady } = useContext(SocketContext);
  const theme = useTheme();

  const [title, setTitle] = useState(card.title || "");
  const [description, setDescription] = useState(card.description || "");
  const [dueDate, setDueDate] = useState(
    card.dueDate ? new Date(card.dueDate).toISOString().slice(0, 16) : ""
  );
  const [cover, setCover] = useState(card.cover || "");
  const [coverType, setCoverType] = useState(
    card.cover && card.cover.startsWith("#") ? "color" : "image"
  );
  const [loading, setLoading] = useState(false);
  const [coverError, setCoverError] = useState(null);

  // Gợi ý màu
  const suggestedColors = [
    "#FF6900", "#FCB900", "#00D084", "#0693E3", "#EB144C",
    "#9900EF", "#8ED1FC", "#F78DA7", "#B80000", "#7BDCB5",
  ];

  // Gợi ý ảnh (Unsplash)
  const suggestedImages = [
    "https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=400",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400",
    "https://images.unsplash.com/photo-1555066931-4365d14bab1d?w=400",
  ];

  const isValidHexColor = (value) => /^#[0-9A-Fa-f]{6}$/.test(value);

  const isValidImageUrl = (value) => {
    return (
      /^https?:\/\/.+/i.test(value) ||
      /^data:image\/.+;base64,/.test(value)
    );
  };

  useEffect(() => {
    setTitle(card.title || "");
    setDescription(card.description || "");
    setDueDate(card.dueDate ? new Date(card.dueDate).toISOString().slice(0, 16) : "");
    setCover(card.cover || "");
    setCoverType(card.cover?.startsWith("#") ? "color" : "image");
  }, [card]);

  const handleCoverChange = (e) => {
    const value = e.target.value.trim();
    setCover(value);

    if (coverType === "color") {
      if (value && !isValidHexColor(value)) {
        setCoverError("Màu phải là mã HEX hợp lệ (ví dụ: #FF0000)");
      } else {
        setCoverError(null);
      }
    } else if (coverType === "image") {
      if (value && !isValidImageUrl(value)) {
        setCoverError("URL ảnh không hợp lệ");
      } else {
        setCoverError(null);
      }
    }
  };

  const handleColorSelect = (color) => {
    setCoverType("color");
    setCover(color);
    setCoverError(null);
  };

  const handleImageSelect = (url) => {
    setCoverType("image");
    setCover(url);
    setCoverError(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh!");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh không được quá 5MB!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setCoverType("image");
      setCover(dataUrl);
      setCoverError(null);
      toast.success("Đã tải ảnh lên!");
    };
    reader.onerror = () => {
      toast.error("Lỗi khi đọc file!");
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateCard = async () => {
    if (!title.trim()) {
      toast.error("Tiêu đề không được để trống!");
      return;
    }

    if (cover && coverType === "color" && !isValidHexColor(cover)) {
      toast.error("Màu không hợp lệ!");
      return;
    }

    if (cover && coverType === "image" && !isValidImageUrl(cover)) {
      toast.error("URL ảnh không hợp lệ!");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token!");

      const response = await axios.put(
        `http://localhost:5000/api/cards/${card._id}`,
        {
          title: title.trim(),
          description: description.trim() || null,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          cover: cover ? cover.trim() : null,
          version: card.version
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedCard = response.data;

      setColumns((prevColumns) =>
        prevColumns.map((col) => ({
          ...col,
          cards: col.cards.map((c) =>
            c._id === card._id ? { ...c, ...updatedCard } : c
          ),
        }))
      );

      if (socket && socketReady) {
        socket.emit("card-updated", { cardId: card._id, card: updatedCard });
      }

      toast.success("Cập nhật thẻ thành công!");
      onClose();
    } catch (err) {
      console.error("Error updating card:", err);
      const msg = err.response?.data?.message || err.message;
      toast.error(`Lỗi: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
        Chỉnh sửa thẻ
      </DialogTitle>

      <DialogContent dividers>
        <TextField
          autoFocus
          margin="dense"
          label="Tiêu đề"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          variant="outlined"
          sx={textFieldSx}
        />

        <TextField
          margin="dense"
          label="Mô tả"
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          variant="outlined"
          sx={textFieldSx}
        />

        <TextField
          margin="dense"
          label="Hạn chót"
          type="datetime-local"
          fullWidth
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={loading}
          variant="outlined"
          sx={textFieldSx}
        />

        {/* BÌẢNH */}
        <Box sx={{ mt: 2 }}>
          <Tabs
            value={coverType}
            onChange={(_, v) => {
              setCoverType(v);
              if (v === "color" && !cover.startsWith("#")) setCover("");
              if (v === "image" && cover.startsWith("#")) setCover("");
            }}
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            <Tab icon={<PaletteIcon />} label="Màu" value="color" />
            <Tab icon={<ImageIcon />} label="Ảnh" value="image" />
          </Tabs>

          {/* MÀU */}
          {coverType === "color" && (
            <>
              <TextField
                label="Màu bìa (HEX)"
                fullWidth
                value={cover}
                onChange={handleCoverChange}
                error={!!coverError}
                helperText={coverError || "Ví dụ: #FF0000"}
                placeholder="#FF0000"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          bgcolor: isValidHexColor(cover) ? cover : "#ccc",
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
                disabled={loading}
                variant="outlined"
                sx={textFieldSx}
              />

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
                {suggestedColors.map((color) => (
                  <Box
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: color,
                      borderRadius: 2,
                      cursor: "pointer",
                      border: `3px solid ${cover === color ? theme.palette.primary.main : "transparent"}`,
                      transition: "all 0.2s",
                      "&:hover": {
                        transform: "scale(1.15)",
                        boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
                      },
                    }}
                  />
                ))}
              </Box>
            </>
          )}

          {/* ẢNH */}
          {coverType === "image" && (
            <>
              <TextField
                label="URL ảnh hoặc tải lên"
                fullWidth
                value={cover}
                onChange={handleCoverChange}
                error={!!coverError}
                helperText={coverError || "Dán link ảnh hoặc tải từ máy"}
                placeholder="https://..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {cover && isValidImageUrl(cover) ? (
                        <Box
                          component="img"
                          src={cover}
                          alt="preview"
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 1,
                            objectFit: "cover",
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        />
                      ) : (
                        <ImageIcon color="action" />
                      )}
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Tải ảnh từ máy (tối đa 5MB)">
                        <label htmlFor="upload-cover-image">
                          <IconButton component="span" size="small">
                            <CloudUploadIcon />
                          </IconButton>
                        </label>
                      </Tooltip>
                      <input
                        id="upload-cover-image"
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleFileUpload}
                      />
                    </InputAdornment>
                  ),
                }}
                disabled={loading}
                variant="outlined"
                sx={textFieldSx}
              />

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Gợi ý ảnh đẹp:
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                {suggestedImages.map((url) => (
                  <Box
                    key={url}
                    onClick={() => handleImageSelect(url)}
                    sx={{
                      width: 80,
                      height: 60,
                      borderRadius: 1,
                      overflow: "hidden",
                      cursor: "pointer",
                      border: `2px solid ${cover === url ? theme.palette.primary.main : "transparent"}`,
                      "&:hover": { opacity: 0.8 },
                    }}
                  >
                    <img
                      src={url}
                      alt="cover"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading} size="large">
          Hủy
        </Button>
        <Button
          onClick={handleUpdateCard}
          variant="contained"
          disabled={loading || !title.trim() || !!coverError}
          size="large"
          sx={{ minWidth: 120 }}
        >
          {loading ? "Đang lưu..." : "Cập nhật"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: (theme) =>
      theme.palette.mode === "dark"
        ? "rgba(255, 255, 255, 0.05)"
        : theme.palette.background.default,
    borderRadius: 2,
    "& fieldset": {
      borderColor: (theme) =>
        theme.palette.mode === "dark" ? theme.palette.grey[600] : theme.palette.divider,
    },
    "&:hover fieldset": {
      borderColor: (theme) =>
        theme.palette.mode === "dark" ? theme.palette.grey[500] : theme.palette.text.secondary,
    },
    "&.Mui-focused fieldset": {
      borderColor: (theme) => theme.palette.primary.main,
    },
  },
  "& .MuiInputLabel-root": {
    color: (theme) =>
      theme.palette.mode === "dark" ? theme.palette.grey[400] : theme.palette.text.secondary,
    "&.Mui-focused": { color: (theme) => theme.palette.primary.main },
  },
  "& .MuiInputBase-input": {
    color: (theme) =>
      theme.palette.mode === "dark" ? theme.palette.grey[200] : theme.palette.text.primary,
  },
};

export default EditCardDialog;