import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  TextField,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Fade,
  Grow,
  Tooltip,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { toast } from "react-toastify";
import { useTheme } from "@mui/material/styles";

const ChecklistsSection = ({
  checklists,
  checklistTitle,
  setChecklistTitle,
  handleAddChecklist,
  handleAddChecklistItem,
  handleToggleChecklistItem,
  handleEditChecklist,
  handleDeleteChecklist,
  handleEditChecklistItem,
  handleDeleteChecklistItem,
  loading,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // State
  const [editChecklistId, setEditChecklistId] = useState(null);
  const [editChecklistTitle, setEditChecklistTitle] = useState("");
  const [editItem, setEditItem] = useState({
    checklistId: null,
    itemId: null,
    title: "",
    content: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    type: "",
    checklistId: null,
    itemId: null,
  });
  const [viewItem, setViewItem] = useState({
    open: false,
    title: "",
    content: "",
  });
  const [checklistInputs, setChecklistInputs] = useState({});
  const [visibleItems, setVisibleItems] = useState({}); // Theo dõi số item hiển thị

  // Kiểm tra và lọc checklists
  const filteredChecklists = Array.isArray(checklists)
    ? checklists.filter((checklist) => !checklist.isDeleted)
    : [];

  // Đồng bộ checklistInputs và visibleItems với checklists
  useEffect(() => {
    setChecklistInputs((prev) => {
      const newInputs = { ...prev };
      filteredChecklists.forEach((checklist) => {
        if (!newInputs[checklist._id]) {
          newInputs[checklist._id] = { title: "", content: "" };
        }
      });
      return newInputs;
    });

    setVisibleItems((prev) => {
      const newVisible = { ...prev };
      filteredChecklists.forEach((checklist) => {
        if (!newVisible[checklist._id]) {
          newVisible[checklist._id] = 5; // Mặc định hiển thị 5 item
        }
      });
      return newVisible;
    });
  }, [filteredChecklists]);

  // Log để debug
  useEffect(() => {
    console.log("Checklists props:", checklists);
    console.log("Filtered Checklists:", filteredChecklists);
    console.log("ChecklistInputs:", checklistInputs);
    console.log("VisibleItems:", visibleItems);
  }, [checklists, filteredChecklists, checklistInputs, visibleItems]);

  // Hàm xử lý giao diện
  const openEditChecklist = (checklistId, title) => {
    setEditChecklistId(checklistId);
    setEditChecklistTitle(title || "");
  };

  const openEditItem = (checklistId, itemId, title, content) => {
    setEditItem({ checklistId, itemId, title: title || "", content: content || "" });
  };

  const openViewItem = (title, content) => {
    setViewItem({ open: true, title: title || "", content: content || "" });
  };

  const closeViewItem = () => {
    setViewItem({ open: false, title: "", content: "" });
  };

  const handleConfirmDelete = (type, checklistId, itemId = null) => {
    setDeleteConfirm({ open: true, type, checklistId, itemId });
  };

  const handleCloseConfirm = () => {
    setDeleteConfirm({ open: false, type: "", checklistId: null, itemId: null });
  };

  const handleSubmitEditChecklist = async (checklistId) => {
    if (!editChecklistTitle.trim()) {
      toast.error("Tiêu đề checklist không được để trống!");
      return;
    }
    try {
      await handleEditChecklist(checklistId, editChecklistTitle);
      setEditChecklistId(null);
      setEditChecklistTitle("");
      toast.success("Cập nhật checklist thành công!");
    } catch (err) {
      toast.error("Lỗi khi cập nhật checklist!");
      console.error("Error in handleSubmitEditChecklist:", err);
    }
  };

  const handleSubmitEditItem = async () => {
    if (!editItem.title.trim() || !editItem.content.trim()) {
      toast.error("Tiêu đề và nội dung item không được để trống!");
      return;
    }
    try {
      await handleEditChecklistItem(
        editItem.checklistId,
        editItem.itemId,
        editItem.title,
        editItem.content
      );
      setEditItem({ checklistId: null, itemId: null, title: "", content: "" });
      toast.success("Cập nhật item thành công!");
    } catch (err) {
      toast.error("Lỗi khi cập nhật item!");
      console.error("Error in handleSubmitEditItem:", err);
    }
  };

  // Xử lý nhập liệu cho từng checklist
  const handleChecklistInputChange = (checklistId, field, value) => {
    setChecklistInputs((prev) => ({
      ...prev,
      [checklistId]: {
        ...prev[checklistId],
        [field]: field === "content" ? value.slice(0, 500) : value, // Giới hạn content 500 ký tự
      },
    }));
  };

  const clearChecklistInputs = (checklistId) => {
    setChecklistInputs((prev) => ({
      ...prev,
      [checklistId]: { title: "", content: "" },
    }));
  };

  // Tính toán tiến độ checklist
  const getProgress = (items) => {
    if (!items || items.length === 0) return 0;
    const completed = items.filter((item) => item.completed && !item.isDeleted).length;
    return (completed / items.filter((item) => !item.isDeleted).length) * 100;
  };

  return (
    <Box sx={{ mb: 4, px: { xs: 2, sm: 3 }, py: 2 }}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: isDarkMode ? theme.palette.grey[100] : theme.palette.text.primary,
          mb: 4,
          letterSpacing: "-0.5px",
          fontSize: { xs: "1.5rem", sm: "1.75rem" },
        }}
      >
        Checklists
      </Typography>

      {/* Danh sách checklists */}
      {filteredChecklists.length > 0 ? (
        <Fade in timeout={600}>
          <Box>
            {filteredChecklists.map((checklist) => {
              if (!checklist || typeof checklist !== "object") {
                return (
                  <Typography
                    key={checklist?._id || Math.random()}
                    color="error"
                    sx={{
                      p: 2,
                      bgcolor: isDarkMode ? "#3f3f3f" : "#ffebee",
                      borderRadius: 2,
                      mb: 2,
                    }}
                  >
                    Checklist không hợp lệ
                  </Typography>
                );
              }

              const filteredItems = Array.isArray(checklist.items)
                ? checklist.items.filter((item) => !item.isDeleted)
                : [];
              const inputs = checklistInputs[checklist._id] || { title: "", content: "" };
              const visibleCount = visibleItems[checklist._id] || 5;

              return (
                <Grow in timeout={400} key={checklist._id}>
                  <Box
                    sx={{
                      mb: 4,
                      p: { xs: 2, sm: 3 },
                      bgcolor: isDarkMode ? "#1e1e2f" : "#ffffff",
                      borderRadius: 3,
                      boxShadow: isDarkMode
                        ? "0 6px 20px rgba(0, 0, 0, 0.3)"
                        : "0 6px 20px rgba(0, 0, 0, 0.08)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: isDarkMode
                          ? "0 8px 24px rgba(0, 0, 0, 0.4)"
                          : "0 8px 24px rgba(0, 0, 0, 0.12)",
                      },
                    }}
                  >
                    {/* Tiêu đề checklist */}
                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                      {editChecklistId === checklist._id ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={editChecklistTitle}
                            onChange={(e) => setEditChecklistTitle(e.target.value)}
                            placeholder="Nhập tiêu đề checklist..."
                            variant="outlined"
                            disabled={loading.checklist}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                bgcolor: isDarkMode ? "#2a2a3d" : "#f7f7f7",
                                borderRadius: 2,
                                "& fieldset": {
                                  borderColor: isDarkMode ? "#555" : "#ddd",
                                },
                                "&:hover fieldset": { borderColor: theme.palette.primary.main },
                                "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
                              },
                            }}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleSubmitEditChecklist(checklist._id)}
                            disabled={loading.checklist || !editChecklistTitle.trim()}
                            sx={{
                              bgcolor: theme.palette.primary.main,
                              borderRadius: 2,
                              px: 3,
                              "&:hover": { bgcolor: theme.palette.primary.dark },
                              textTransform: "none",
                            }}
                          >
                            Lưu
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              setEditChecklistId(null);
                              setEditChecklistTitle("");
                            }}
                            sx={{
                              borderRadius: 2,
                              borderColor: isDarkMode ? "#555" : "#ddd",
                              color: isDarkMode ? theme.palette.grey[400] : theme.palette.text.secondary,
                              textTransform: "none",
                            }}
                          >
                            Hủy
                          </Button>
                        </Box>
                      ) : (
                        <>
                          <Typography
                            variant="h6"
                            sx={{
                              flex: 1,
                              fontWeight: 600,
                              color: isDarkMode ? theme.palette.grey[100] : theme.palette.text.primary,
                              fontSize: { xs: "1.1rem", sm: "1.25rem" },
                              wordBreak: "break-word", // Ngắt từ nếu tiêu đề checklist quá dài
                            }}
                          >
                            {checklist.title || "Checklist không có tiêu đề"}
                          </Typography>
                          <IconButton
                            onClick={() => openEditChecklist(checklist._id, checklist.title)}
                            size="small"
                            sx={{
                              "&:hover": { bgcolor: isDarkMode ? "#3f3f3f" : "#f0f0f0" },
                            }}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => handleConfirmDelete("checklist", checklist._id)}
                            size="small"
                            sx={{
                              "&:hover": { bgcolor: isDarkMode ? "#3f3f3f" : "#f0f0f0" },
                            }}
                          >
                            <DeleteOutlineIcon fontSize="small" color="error" />
                          </IconButton>
                        </>
                      )}
                    </Box>

                    {/* Thanh tiến độ */}
                    {filteredItems.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <LinearProgress
                          variant="determinate"
                          value={getProgress(checklist.items)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: isDarkMode ? "#3f3f3f" : "#e0e0e0",
                            "& .MuiLinearProgress-bar": {
                              bgcolor: theme.palette.success.main,
                              borderRadius: 4,
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            mt: 1,
                            color: isDarkMode ? theme.palette.grey[400] : theme.palette.text.secondary,
                            fontSize: "0.85rem",
                          }}
                        >
                          {Math.round(getProgress(checklist.items))}% hoàn thành
                        </Typography>
                      </Box>
                    )}

                    {/* Danh sách items */}
                    {filteredItems.length > 0 ? (
                      <List dense sx={{ mb: 2 }}>
                        {filteredItems.slice(0, visibleCount).map((item) => (
                          <ListItem
                            key={item._id}
                            sx={{
                              py: { xs: 0.5, sm: 1 },
                              px: { xs: 1, sm: 2 },
                              borderRadius: 2,
                              mb: 1,
                              "&:hover": {
                                bgcolor: isDarkMode ? "#2a2a3d" : "#f7f7f7",
                              },
                              transition: "background-color 0.2s",
                              flexDirection: "column",
                              alignItems: "flex-start",
                            }}
                            secondaryAction={
                              <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 1 }, alignSelf: "flex-end" }}>
                                <Checkbox
                                  edge="end"
                                  checked={item.completed || false}
                                  onChange={() => handleToggleChecklistItem(checklist._id, item._id)}
                                  disabled={loading.checklistToggle}
                                  icon={<CheckCircleOutlineIcon />}
                                  checkedIcon={<CheckCircleOutlineIcon color="success" />}
                                  sx={{ p: 0.5 }}
                                />
                                <IconButton
                                  onClick={() =>
                                    openEditItem(checklist._id, item._id, item.title, item.content)
                                  }
                                  size="small"
                                  sx={{ "&:hover": { bgcolor: isDarkMode ? "#3f3f3f" : "#f0f0f0" } }}
                                >
                                  <EditOutlinedIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  onClick={() => handleConfirmDelete("item", checklist._id, item._id)}
                                  size="small"
                                  sx={{ "&:hover": { bgcolor: isDarkMode ? "#3f3f3f" : "#f0f0f0" } }}
                                >
                                  <DeleteOutlineIcon fontSize="small" color="error" />
                                </IconButton>
                              </Box>
                            }
                          >
                            <Box
                              sx={{ display: "flex", alignItems: "center", width: "100%", mb: 0.5 }}
                            >
                              <Typography
                                sx={{
                                  flex: 1,
                                  fontWeight: 500,
                                  fontSize: { xs: "0.85rem", sm: "0.95rem" },
                                  color: isDarkMode
                                    ? theme.palette.grey[200]
                                    : theme.palette.text.primary,
                                  textDecoration: item.completed ? "line-through" : "none",
                                  cursor: "pointer",
                                  wordBreak: "break-word", // Ngắt từ nếu tiêu đề quá dài
                                }}
                                onClick={() => openViewItem(item.title, item.content)}
                              >
                                {item.title || "Item không có tiêu đề"}
                              </Typography>
                            </Box>
                            <Tooltip title={item.content || "Không có nội dung"} placement="top">
                              <Typography
                                sx={{
                                  fontSize: { xs: "0.75rem", sm: "0.85rem" },
                                  color: isDarkMode
                                    ? theme.palette.grey[400]
                                    : theme.palette.text.secondary,
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  maxWidth: "90%",
                                  cursor: "pointer",
                                  wordBreak: "break-word", // Ngắt từ nếu nội dung ngắn quá dài
                                }}
                                onClick={() => openViewItem(item.title, item.content)}
                              >
                                {item.content.length > 10
                                  ? `${item.content.slice(0, 10)}...`
                                  : item.content || "Không có nội dung"}
                              </Typography>
                            </Tooltip>
                            {item.content && item.content.length > 50 && (
                              <Button
                                size="small"
                                onClick={() => openViewItem(item.title, item.content)}
                                sx={{
                                  mt: 0.5,
                                  color: theme.palette.primary.main,
                                  textTransform: "none",
                                  fontSize: "0.8rem",
                                }}
                              >
                                Xem chi tiết
                              </Button>
                            )}
                          </ListItem>
                        ))}
                        {filteredItems.length > visibleCount && (
                          <Button
                            onClick={() =>
                              setVisibleItems((prev) => ({
                                ...prev,
                                [checklist._id]: prev[checklist._id] + 5,
                              }))
                            }
                            sx={{
                              mt: 2,
                              color: theme.palette.primary.main,
                              textTransform: "none",
                              mx: "auto",
                              display: "block",
                            }}
                          >
                            Tải thêm
                          </Button>
                        )}
                      </List>
                    ) : (
                      <Typography
                        sx={{
                          color: isDarkMode ? theme.palette.grey[400] : theme.palette.text.secondary,
                          p: 2,
                          fontStyle: "italic",
                        }}
                      >
                        Không có item trong checklist này.
                      </Typography>
                    )}

                    {/* Thêm item mới */}
                    <Box sx={{ mt: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Thêm tiêu đề item..."
                        value={inputs.title || ""}
                        onChange={(e) =>
                          handleChecklistInputChange(checklist._id, "title", e.target.value)
                        }
                        variant="outlined"
                        disabled={loading.checklistItem}
                        sx={{
                          mb: 2,
                          "& .MuiOutlinedInput-root": {
                            bgcolor: isDarkMode ? "#2a2a3d" : "#f7f7f7",
                            borderRadius: 2,
                            "& fieldset": { borderColor: isDarkMode ? "#555" : "#ddd" },
                            "&:hover fieldset": { borderColor: theme.palette.primary.main },
                            "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
                          },
                        }}
                      />
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Thêm nội dung item..."
                        value={inputs.content || ""}
                        onChange={(e) =>
                          handleChecklistInputChange(checklist._id, "content", e.target.value)
                        }
                        variant="outlined"
                        multiline
                        rows={2}
                        disabled={loading.checklistItem}
                        inputProps={{ maxLength: 500 }} // Giới hạn 500 ký tự
                        sx={{
                          mb: 2,
                          "& .MuiOutlinedInput-root": {
                            bgcolor: isDarkMode ? "#2a2a3d" : "#f7f7f7",
                            borderRadius: 2,
                            "& fieldset": { borderColor: isDarkMode ? "#555" : "#ddd" },
                            "&:hover fieldset": { borderColor: theme.palette.primary.main },
                            "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
                          },
                        }}
                      />
                      <Button
                        variant="contained"
                        size="medium"
                        onClick={() => {
                          handleAddChecklistItem(checklist._id, {
                            title: inputs.title || "",
                            content: inputs.content || "",
                          });
                          clearChecklistInputs(checklist._id);
                        }}
                        disabled={
                          loading.checklistItem ||
                          !inputs.title?.trim() ||
                          !inputs.content?.trim()
                        }
                        startIcon={<AddCircleOutlineIcon />}
                        sx={{
                          borderRadius: 2,
                          bgcolor: theme.palette.primary.main,
                          "&:hover": { bgcolor: theme.palette.primary.dark },
                          textTransform: "none",
                          px: 3,
                          py: 1,
                          fontSize: "0.9rem",
                        }}
                      >
                        Thêm Item
                      </Button>
                    </Box>
                  </Box>
                </Grow>
              );
            })}
          </Box>
        </Fade>
      ) : (
        <Typography
          sx={{
            color: isDarkMode ? theme.palette.grey[400] : theme.palette.text.secondary,
            p: 3,
            bgcolor: isDarkMode ? "#1e1e2f" : "#f7f7f7",
            borderRadius: 3,
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
          Chưa có checklist nào. Hãy thêm một checklist mới!
        </Typography>
      )}

      {/* Thêm checklist mới */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mt: 4,
          p: { xs: 2, sm: 3 },
          bgcolor: isDarkMode ? "#1e1e2f" : "#ffffff",
          borderRadius: 3,
          boxShadow: isDarkMode
            ? "0 6px 20px rgba(0, 0, 0, 0.3)"
            : "0 6px 20px rgba(0, 0, 0, 0.08)",
        }}
      >
        <CheckCircleOutlineIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
        <TextField
          fullWidth
          size="small"
          placeholder="Thêm tiêu đề checklist..."
          value={checklistTitle}
          onChange={(e) => setChecklistTitle(e.target.value)}
          variant="outlined"
          disabled={loading.checklist}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: isDarkMode ? "#2a2a3d" : "#f7f7f7",
              borderRadius: 2,
              "& fieldset": { borderColor: isDarkMode ? "#555" : "#ddd" },
              "&:hover fieldset": { borderColor: theme.palette.primary.main },
              "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
            },
          }}
        />
        <Button
          variant="contained"
          size="medium"
          onClick={async () => {
            await handleAddChecklist();
          }}
          disabled={loading.checklist || !checklistTitle.trim()}
          startIcon={<AddCircleOutlineIcon />}
          sx={{
            borderRadius: 2,
            bgcolor: theme.palette.primary.main,
            "&:hover": { bgcolor: theme.palette.primary.dark },
            textTransform: "none",
            px: 3,
            py: 1,
            fontSize: "0.9rem",
          }}
        >
          {loading.checklist ? <CircularProgress size={20} color="inherit" /> : "Thêm Checklist"}
        </Button>
      </Box>

      {/* Dialog xác nhận xóa */}
      <Dialog
        open={deleteConfirm.open}
        onClose={handleCloseConfirm}
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 3,
            bgcolor: isDarkMode ? "#1e1e2f" : "#ffffff",
            boxShadow: isDarkMode
              ? "0 8px 24px rgba(0, 0, 0, 0.3)"
              : "0 8px 24px rgba(0, 0, 0, 0.1)",
            p: 2,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: "1.25rem" }}>
          Xác nhận xóa
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: isDarkMode ? theme.palette.grey[200] : theme.palette.text.primary }}>
            Bạn có chắc muốn xóa {deleteConfirm.type === "checklist" ? "checklist" : "item"} này?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseConfirm}
            sx={{
              color: isDarkMode ? theme.palette.grey[400] : theme.palette.text.secondary,
              textTransform: "none",
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={async () => {
              try {
                if (deleteConfirm.type === "checklist") {
                  await handleDeleteChecklist(deleteConfirm.checklistId);
                } else {
                  await handleDeleteChecklistItem(deleteConfirm.checklistId, deleteConfirm.itemId);
                }
                handleCloseConfirm();
                toast.success(`Xóa ${deleteConfirm.type === "checklist" ? "checklist" : "item"} thành công!`);
              } catch (err) {
                toast.error("Lỗi khi xóa!");
                console.error("Error in delete action:", err);
              }
            }}
            sx={{ color: theme.palette.error.main, textTransform: "none" }}
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog chỉnh sửa item */}
      <Dialog
        open={editItem.checklistId !== null && editItem.itemId !== null}
        onClose={() => setEditItem({ checklistId: null, itemId: null, title: "", content: "" })}
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 3,
            bgcolor: isDarkMode ? "#1e1e2f" : "#ffffff",
            boxShadow: isDarkMode
              ? "0 8px 24px rgba(0, 0, 0, 0.3)"
              : "0 8px 24px rgba(0, 0, 0, 0.1)",
            p: 2,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: "1.25rem" }}>
          Chỉnh sửa Checklist Item
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            label="Tiêu đề"
            value={editItem.title}
            onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
            variant="outlined"
            disabled={loading.checklistItem}
            sx={{
              mb: 2,
              mt: 1,
              "& .MuiOutlinedInput-root": { borderRadius: 2 },
              "& .MuiInputLabel-root": {
                color: isDarkMode ? theme.palette.grey[400] : theme.palette.text.secondary,
              },
            }}
          />
          <TextField
            fullWidth
            size="small"
            label="Nội dung"
            value={editItem.content}
            onChange={(e) => setEditItem({ ...editItem, content: e.target.value.slice(0, 500) })}
            variant="outlined"
            multiline
            rows={4}
            disabled={loading.checklistItem}
            inputProps={{ maxLength: 500 }} // Giới hạn 500 ký tự
            sx={{
              "& .MuiOutlinedInput-root": { borderRadius: 2 },
              "& .MuiInputLabel-root": {
                color: isDarkMode ? theme.palette.grey[400] : theme.palette.text.secondary,
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditItem({ checklistId: null, itemId: null, title: "", content: "" })}
            sx={{
              color: isDarkMode ? theme.palette.grey[400] : theme.palette.text.secondary,
              textTransform: "none",
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmitEditItem}
            disabled={loading.checklistItem || !editItem.title.trim() || !editItem.content.trim()}
            sx={{ color: theme.palette.primary.main, textTransform: "none" }}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog xem chi tiết item */}
      <Dialog
        open={viewItem.open}
        onClose={closeViewItem}
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 3,
            bgcolor: isDarkMode ? "#1e1e2f" : "#ffffff",
            boxShadow: isDarkMode
              ? "0 8px 24px rgba(0, 0, 0, 0.3)"
              : "0 8px 24px rgba(0, 0, 0, 0.1)",
            p: 2,
            maxWidth: { xs: "90%", sm: 600 }, // Responsive cho màn hình nhỏ
            maxHeight: "80vh",
            width: "100%",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: "1.25rem" }}>
          Chi tiết Checklist Item
        </DialogTitle>
        <DialogContent sx={{ maxHeight: 400, overflowY: "auto", overflowX: "hidden" }}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: "1rem",
              color: isDarkMode ? theme.palette.grey[200] : theme.palette.text.primary,
              mb: 2,
              wordBreak: "break-word", // Ngắt từ cho tiêu đề
            }}
          >
            {viewItem.title || "Item không có tiêu đề"}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.9rem",
              color: isDarkMode ? theme.palette.grey[400] : theme.palette.text.secondary,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word", // Ngắt từ cho nội dung
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: isDarkMode ? "#555" : "#ccc",
                borderRadius: "3px",
              },
            }}
          >
            {viewItem.content || "Không có nội dung"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={closeViewItem}
            sx={{
              color: isDarkMode ? theme.palette.grey[400] : theme.palette.text.secondary,
              textTransform: "none",
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChecklistsSection;