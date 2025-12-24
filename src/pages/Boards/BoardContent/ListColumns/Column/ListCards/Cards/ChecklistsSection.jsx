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
  Collapse,
  Alert,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import LockIcon from "@mui/icons-material/Lock";
import { toast } from "react-toastify";
import { useTheme } from "@mui/material/styles";

// Object chứa các style tái sử dụng
const getStyles = (theme, isDarkMode) => ({
  container: {
    mb: 2,
    px: { xs: 1, sm: 2 },
    py: 1,
  },
  sectionTitle: {
    fontWeight: 600,
    color: isDarkMode ? theme.palette.grey[100] : theme.palette.text.primary,
    mb: 1,
    letterSpacing: "-0.25px",
    fontSize: { xs: "1.1rem", sm: "1.25rem" },
  },
  checklistBox: {
    mb: 2,
    p: { xs: 1.5, sm: 2 },
    bgcolor: isDarkMode ? "#1e1e2f" : "#ffffff",
    borderRadius: 2,
    boxShadow: isDarkMode ? "0 4px 12px rgba(0, 0, 0, 0.25)" : "0 4px 12px rgba(0, 0, 0, 0.06)",
    transition: "all 0.2s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: isDarkMode ? "0 6px 16px rgba(0, 0, 0, 0.3)" : "0 6px 16px rgba(0, 0, 0, 0.08)",
    },
  },
  textField: {
    "& .MuiOutlinedInput-root": {
      bgcolor: isDarkMode ? "#2a2a3d" : "#f7f7f7",
      borderRadius: 1.5,
      "& fieldset": { borderColor: isDarkMode ? "#555" : "#ddd" },
      "&:hover fieldset": { borderColor: theme.palette.primary.main },
      "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
      fontSize: "0.875rem",
    },
  },
  button: {
    borderRadius: 1.5,
    bgcolor: theme.palette.primary.main,
    "&:hover": { bgcolor: theme.palette.primary.dark },
    textTransform: "none",
    px: 2,
    py: 0.75,
    fontSize: "0.8rem",
    minHeight: "auto",
  },
  dialogPaper: {
    borderRadius: 2,
    bgcolor: isDarkMode ? "#1e1e2f" : "#ffffff",
    boxShadow: isDarkMode ? "0 6px 16px rgba(0, 0, 0, 0.25)" : "0 6px 16px rgba(0, 0, 0, 0.08)",
    p: 1.5,
  },
  listItem: {
    py: 0.75,
    px: 1,
    borderRadius: 1.5,
    mb: 0.75,
    "&:hover": { bgcolor: isDarkMode ? "#2a2a3d" : "#f7f7f7" },
    transition: "background-color 0.15s",
    display: "flex",
    alignItems: "flex-start",
    gap: 1,
  },
  itemActions: {
    display: "flex",
    alignItems: "center",
    gap: 0.25,
    ml: "auto",
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  checklistHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    mb: 1.5,
    cursor: "pointer",
    py: 0.5,
  },
  checklistActions: {
    display: "flex",
    alignItems: "center",
    gap: 0.5,
    ml: 1,
  },
});

const ChecklistsSection = ({
  checklists,
  checklistTitle,
  setChecklistTitle,
  handleAddChecklist,
  handleAddChecklistItem,
  handleToggleChecklistItem,
  handleUpdateChecklist,
  handleDeleteChecklist,
  handleUpdateChecklistItem,
  handleDeleteChecklistItem,
  loading,
  currentUserId, // Thêm prop
  card, // Thêm prop để kiểm tra members
  isBoardOwner, // Thêm prop
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const styles = getStyles(theme, isDarkMode);

  // State
  const [editChecklistId, setEditChecklistId] = useState(null);
  const [editChecklistTitle, setEditChecklistTitle] = useState("");
  const [editItem, setEditItem] = useState({ checklistId: null, itemId: null, title: "", content: "" });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: "", checklistId: null, itemId: null });
  const [viewItem, setViewItem] = useState({ open: false, title: "", content: "" });
  const [checklistInputs, setChecklistInputs] = useState({});
  const [visibleItems, setVisibleItems] = useState({});
  const [isSectionCollapsed, setIsSectionCollapsed] = useState(false);
  const [collapsedChecklists, setCollapsedChecklists] = useState({});

  // Kiểm tra xem user hiện tại có phải là thành viên của card không
  const isCardMember = card?.members?.some(
    (m) => m._id.toString() === currentUserId
  ) || false;

  // Quyền thực hiện các thao tác = (là thành viên của card) HOẶC (là chủ board)
  const canPerformActions = isCardMember || isBoardOwner;

  // Lọc checklists
  const filteredChecklists = Array.isArray(checklists) ? checklists.filter((c) => !c.isDeleted) : [];

  // Đồng bộ inputs, visible items, và trạng thái collapsed
  useEffect(() => {
    setChecklistInputs((prev) => {
      const newInputs = { ...prev };
      filteredChecklists.forEach((checklist) => {
        newInputs[checklist._id] = newInputs[checklist._id] || { title: "", content: "" };
      });
      return newInputs;
    });

    setVisibleItems((prev) => {
      const newVisible = { ...prev };
      filteredChecklists.forEach((checklist) => {
        newVisible[checklist._id] = newVisible[checklist._id] || 3;
      });
      return newVisible;
    });

    setCollapsedChecklists((prev) => {
      const newCollapsed = { ...prev };
      filteredChecklists.forEach((checklist) => {
        if (newCollapsed[checklist._id] === undefined) {
          newCollapsed[checklist._id] = false;
        }
      });
      return newCollapsed;
    });
  }, [filteredChecklists]);

  // Hàm xử lý giao diện
  const openEditChecklist = (id, title) => {
    if (!canPerformActions) {
      toast.warning("Bạn không có quyền chỉnh sửa checklist này!");
      return;
    }
    setEditChecklistId(id);
    setEditChecklistTitle(title || "");
  };

  const openEditItem = (checklistId, itemId, title, content) => {
    if (!canPerformActions) {
      toast.warning("Bạn không có quyền chỉnh sửa item này!");
      return;
    }
    setEditItem({ checklistId, itemId, title: title || "", content: content || "" });
  };

  const openViewItem = (title, content) => {
    setViewItem({ open: true, title: title || "", content: content || "" });
  };

  const closeViewItem = () => {
    setViewItem({ open: false, title: "", content: "" });
  };

  const handleConfirmDelete = (type, checklistId, itemId = null) => {
    if (!canPerformActions) {
      toast.warning(`Bạn không có quyền xóa ${type === "checklist" ? "checklist" : "item"} này!`);
      return;
    }
    setDeleteConfirm({ open: true, type, checklistId, itemId });
  };

  const handleCloseConfirm = () => {
    setDeleteConfirm({ open: false, type: "", checklistId: null, itemId: null });
  };

  const handleChecklistInputChange = (checklistId, field, value) => {
    setChecklistInputs((prev) => ({
      ...prev,
      [checklistId]: {
        ...prev[checklistId],
        [field]: field === "content" ? value.slice(0, 300) : value,
      },
    }));
  };

  const clearChecklistInputs = (checklistId) => {
    setChecklistInputs((prev) => ({
      ...prev,
      [checklistId]: { title: "", content: "" },
    }));
  };

  const toggleSectionCollapse = () => {
    setIsSectionCollapsed((prev) => !prev);
  };

  const toggleChecklistCollapse = (checklistId) => {
    setCollapsedChecklists((prev) => ({
      ...prev,
      [checklistId]: !prev[checklistId],
    }));
  };

  // Tính toán tiến độ checklist
  const getProgress = (items) => {
    if (!Array.isArray(items) || items.length === 0) return 0;
    const completed = items.filter((item) => item.completed && !item.isDeleted).length;
    return (completed / items.filter((item) => !item.isDeleted).length) * 100;
  };

  // Xử lý submit chỉnh sửa checklist
  const handleSubmitEditChecklist = async (checklistId) => {
    if (!canPerformActions) {
      toast.warning("Bạn không có quyền thực hiện hành động này!");
      return;
    }
    if (!editChecklistTitle.trim()) {
      toast.error("Tiêu đề checklist không được để trống!");
      return;
    }
    try {
      await handleUpdateChecklist(checklistId, editChecklistTitle);
      setEditChecklistId(null);
      setEditChecklistTitle("");
      toast.success("Cập nhật checklist thành công!");
    } catch (err) {
      toast.error("Lỗi khi cập nhật checklist!");
      console.error("Error in handleSubmitEditChecklist:", err);
    }
  };

  // Xử lý submit chỉnh sửa item
  const handleSubmitEditItem = async () => {
    if (!canPerformActions) {
      toast.warning("Bạn không có quyền thực hiện hành động này!");
      return;
    }
    if (!editItem.title.trim() || !editItem.content.trim()) {
      toast.error("Tiêu đề và nội dung item không được để trống!");
      return;
    }
    try {
      await handleUpdateChecklistItem(editItem.checklistId, editItem.itemId, {
        title: editItem.title,
        content: editItem.content,
      });
      setEditItem({ checklistId: null, itemId: null, title: "", content: "" });
      toast.success("Cập nhật item thành công!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi cập nhật item!");
      console.error("Error in handleSubmitEditItem:", err);
    }
  };

  // Xử lý xóa checklist hoặc item
  const handleDelete = async () => {
    if (!canPerformActions) {
      toast.warning("Bạn không có quyền thực hiện hành động này!");
      handleCloseConfirm();
      return;
    }
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
  };

  // Xử lý thêm item mới
  const handleAddItem = async (checklistId, inputs) => {
    if (!canPerformActions) {
      toast.warning("Bạn không có quyền thêm item!");
      return;
    }
    try {
      await handleAddChecklistItem(checklistId, {
        title: inputs.title,
        content: inputs.content,
      });
      clearChecklistInputs(checklistId);
    } catch (err) {
      toast.error("Lỗi khi thêm item!");
      console.error("Error in handleAddItem:", err);
    }
  };

  // Xử lý toggle checklist item
  const handleToggleItem = (checklistId, itemId, completed) => {
    if (!canPerformActions) {
      toast.warning("Chỉ thành viên của thẻ mới được phép đánh dấu hoàn thành!");
      return;
    }
    handleToggleChecklistItem(checklistId, itemId, completed);
  };

  // Xử lý thêm checklist
  const handleAddChecklistWrapper = () => {
    if (!canPerformActions) {
      toast.warning("Bạn không có quyền thêm checklist!");
      return;
    }
    handleAddChecklist();
  };

  return (
    <Box sx={styles.container}>
      {/* Alert nếu không có quyền */}
      {!canPerformActions && (
        <Alert
          severity="info"
          icon={<LockIcon />}
          sx={{ mb: 2, fontSize: "0.85rem" }}
        >
          Bạn chỉ có thể xem Danh sách công việc. Chỉ thành viên của thẻ mới có thể thực hiện các thao tác.
        </Alert>
      )}

      {/* Section Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          mb: 1,
          p: 1,
          borderRadius: 1.5,
          "&:hover": {
            bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
          }
        }}
        onClick={toggleSectionCollapse}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <CheckCircleOutlineIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
          <Typography variant="h6" sx={styles.sectionTitle}>
            Danh sách công việc
          </Typography>
          {!canPerformActions && <LockIcon sx={{ fontSize: 16, color: "text.secondary" }} />}
        </Box>
        <IconButton size="small" sx={{ p: 0.5 }}>
          {isSectionCollapsed ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse in={!isSectionCollapsed}>
        {/* Danh sách checklists */}
        {filteredChecklists.length > 0 ? (
          <Fade in timeout={400}>
            <Box>
              {filteredChecklists.map((checklist) => {
                if (!checklist || typeof checklist !== "object") {
                  return (
                    <Typography
                      key={checklist?._id || Math.random()}
                      color="error"
                      sx={{ p: 1.5, bgcolor: isDarkMode ? "#3f3f3f" : "#ffebee", borderRadius: 1.5, mb: 1, fontSize: "0.875rem" }}
                    >
                      Danh sách công việc không hợp lệ
                    </Typography>
                  );
                }

                const filteredItems = Array.isArray(checklist.items)
                  ? checklist.items.filter((item) => !item.isDeleted)
                  : [];
                const inputs = checklistInputs[checklist._id] || { title: "", content: "" };
                const visibleCount = visibleItems[checklist._id] || 3;

                return (
                  <Grow in timeout={300} key={checklist._id}>
                    <Box sx={styles.checklistBox}>
                      {/* Checklist Header */}
                      <Box sx={styles.checklistHeader}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, minWidth: 0 }}>
                          {editChecklistId === checklist._id ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 0 }}>
                              <TextField
                                fullWidth
                                size="small"
                                value={editChecklistTitle}
                                onChange={(e) => setEditChecklistTitle(e.target.value)}
                                placeholder="Nhập tiêu đề checklist..."
                                variant="outlined"
                                disabled={loading.checklist}
                                sx={styles.textField}
                              />
                              <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleSubmitEditChecklist(checklist._id)}
                                  disabled={loading.checklist || !editChecklistTitle.trim()}
                                  sx={{ ...styles.button, minWidth: 60 }}
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
                                    borderRadius: 1.5,
                                    borderColor: isDarkMode ? "#555" : "#ddd",
                                    color: isDarkMode ? theme.palette.grey[400] : theme.palette.text.secondary,
                                    textTransform: "none",
                                    fontSize: "0.8rem",
                                    py: 0.75,
                                    minWidth: 50,
                                  }}
                                >
                                  Hủy
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            <>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  flex: 1,
                                  fontWeight: 500,
                                  color: isDarkMode ? theme.palette.grey[100] : theme.palette.text.primary,
                                  fontSize: { xs: "0.95rem", sm: "1rem" },
                                  wordBreak: "break-word",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={checklist.title || "Checklist không có tiêu đề"}
                              >
                                {checklist.title || "Checklist không có tiêu đề"}
                              </Typography>
                              <Box sx={styles.checklistActions}>
                                <Tooltip title={canPerformActions ? "Chỉnh sửa" : "Không có quyền"}>
                                  <span>
                                    <IconButton
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditChecklist(checklist._id, checklist.title);
                                      }}
                                      size="small"
                                      disabled={!canPerformActions}
                                      sx={{
                                        p: 0.75,
                                        "&:hover": { bgcolor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }
                                      }}
                                    >
                                      <EditOutlinedIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title={canPerformActions ? "Xóa" : "Không có quyền"}>
                                  <span>
                                    <IconButton
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleConfirmDelete("checklist", checklist._id);
                                      }}
                                      size="small"
                                      disabled={!canPerformActions}
                                      sx={{
                                        p: 0.75,
                                        "&:hover": { bgcolor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }
                                      }}
                                    >
                                      <DeleteOutlineIcon sx={{ fontSize: 18 }} color="error" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <IconButton
                                  onClick={() => toggleChecklistCollapse(checklist._id)}
                                  size="small"
                                  sx={{ p: 0.75 }}
                                >
                                  {collapsedChecklists[checklist._id] ?
                                    <ExpandMoreIcon sx={{ fontSize: 18 }} /> :
                                    <ExpandLessIcon sx={{ fontSize: 18 }} />
                                  }
                                </IconButton>
                              </Box>
                            </>
                          )}
                        </Box>
                      </Box>

                      <Collapse in={!collapsedChecklists[checklist._id]}>
                        {/* Thanh tiến độ */}
                        {filteredItems.length > 0 && (
                          <Box sx={{ mb: 1.5 }}>
                            <LinearProgress
                              variant="determinate"
                              value={getProgress(checklist.items)}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: isDarkMode ? "#3f3f3f" : "#e0e0e0",
                                "& .MuiLinearProgress-bar": { bgcolor: theme.palette.success.main, borderRadius: 3 },
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                mt: 0.5,
                                color: isDarkMode ? theme.palette.grey[400] : theme.palette.text.secondary,
                                fontSize: "0.75rem",
                              }}
                            >
                              {Math.round(getProgress(checklist.items))}% hoàn thành
                            </Typography>
                          </Box>
                        )}

                        {/* Items List */}
                        {filteredItems.length > 0 ? (
                          <List dense sx={{ mb: 1.5, p: 0 }}>
                            {filteredItems.slice(0, visibleCount).map((item) => (
                              <ListItem key={item._id} sx={styles.listItem}>
                                {/* Checkbox */}
                                <Tooltip title={canPerformActions ? "" : "Chỉ thành viên của thẻ mới có thể đánh dấu"}>
                                  <span>
                                    <Checkbox
                                      checked={item.completed || false}
                                      onChange={() => handleToggleItem(checklist._id, item._id, !item.completed)}
                                      disabled={loading.checklistToggle || !canPerformActions}
                                      icon={<CheckCircleOutlineIcon sx={{ fontSize: 20 }} />}
                                      checkedIcon={<CheckCircleOutlineIcon sx={{ fontSize: 20 }} color="success" />}
                                      sx={{ p: 0, mr: 1 }}
                                      size="small"
                                    />
                                  </span>
                                </Tooltip>

                                {/* Content */}
                                <Box sx={styles.itemContent}>
                                  <Typography
                                    sx={{
                                      fontWeight: 450,
                                      fontSize: "0.85rem",
                                      color: isDarkMode ? theme.palette.grey[200] : theme.palette.text.primary,
                                      textDecoration: item.completed ? "line-through" : "none",
                                      cursor: "pointer",
                                      wordBreak: "break-word",
                                      mb: 0.25,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      display: "-webkit-box",
                                      WebkitLineClamp: 1,
                                      WebkitBoxOrient: "vertical",
                                    }}
                                    onClick={() => openViewItem(item.title, item.content)}
                                    title={item.title || "công việc không có tiêu đề"}
                                  >
                                    {item.title || "Công việc không có tiêu đề"}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontSize: "0.75rem",
                                      color: isDarkMode ? theme.palette.grey[400] : theme.palette.text.secondary,
                                      display: "-webkit-box",
                                      WebkitLineClamp: 1,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      cursor: "pointer",
                                      wordBreak: "break-word",
                                    }}
                                    onClick={() => openViewItem(item.title, item.content)}
                                    title={item.content || "Không có nội dung"}
                                  >
                                    {item.content?.length > 40 ? `${item.content.slice(0, 40)}...` : item.content || "Không có nội dung"}
                                  </Typography>
                                </Box>

                                {/* Actions */}
                                <Box sx={styles.itemActions}>
                                  <Tooltip title={canPerformActions ? "Chỉnh sửa" : "Không có quyền"}>
                                    <span>
                                      <IconButton
                                        onClick={() => openEditItem(checklist._id, item._id, item.title, item.content)}
                                        size="small"
                                        disabled={!canPerformActions}
                                        sx={{
                                          p: 0.5,
                                          "&:hover": { bgcolor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }
                                        }}
                                      >
                                        <EditOutlinedIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  <Tooltip title={canPerformActions ? "Xóa" : "Không có quyền"}>
                                    <span>
                                      <IconButton
                                        onClick={() => handleConfirmDelete("item", checklist._id, item._id)}
                                        size="small"
                                        disabled={!canPerformActions}
                                        sx={{
                                          p: 0.5,
                                          "&:hover": { bgcolor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }
                                        }}
                                      >
                                        <DeleteOutlineIcon sx={{ fontSize: 16 }} color="error" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </Box>
                              </ListItem>
                            ))}
                            {filteredItems.length > visibleCount && (
                              <Button
                                onClick={() =>
                                  setVisibleItems((prev) => ({
                                    ...prev,
                                    [checklist._id]: prev[checklist._id] + 3,
                                  }))
                                }
                                sx={{
                                  mt: 1,
                                  color: theme.palette.primary.main,
                                  textTransform: "none",
                                  mx: "auto",
                                  display: "block",
                                  fontSize: "0.75rem",
                                  py: 0.5,
                                }}
                                size="small"
                              >
                                Tải thêm
                              </Button>
                            )}
                          </List>
                        ) : (
                          <Typography
                            sx={{
                              color: isDarkMode ? theme.palette.grey[400] : theme.palette.text.secondary,
                              p: 1.5,
                              fontStyle: "italic",
                              fontSize: "0.8rem",
                              textAlign: "center",
                            }}
                          >
                            Không có Công việc trong danh sách này.
                          </Typography>
                        )}

                        {/* Thêm item mới */}
                        {canPerformActions && (
                          <Box sx={{ mt: 1.5 }}>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Thêm tiêu đề công việc..."
                              value={inputs.title || ""}
                              onChange={(e) => handleChecklistInputChange(checklist._id, "title", e.target.value)}
                              variant="outlined"
                              disabled={loading.checklistItem}
                              error={inputs.title !== "" && !inputs.title?.trim()}
                              helperText={inputs.title !== "" && !inputs.title?.trim() ? "Tiêu đề không được để trống" : ""}
                              sx={styles.textField}
                            />
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Thêm nội dung Công việc..."
                              value={inputs.content || ""}
                              onChange={(e) => handleChecklistInputChange(checklist._id, "content", e.target.value)}
                              variant="outlined"
                              multiline
                              rows={1}
                              disabled={loading.checklistItem}
                              error={inputs.content !== "" && !inputs.content?.trim()}
                              helperText={inputs.content !== "" && !inputs.content?.trim() ? "Nội dung không được để trống" : ""}
                              inputProps={{ maxLength: 300 }}
                              sx={{ ...styles.textField, mt: 1 }}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleAddItem(checklist._id, inputs)}
                              disabled={loading.checklistItem || !inputs.title?.trim() || !inputs.content?.trim()}
                              startIcon={<AddCircleOutlineIcon fontSize="small" />}
                              sx={{ ...styles.button, mt: 1 }}
                            >
                              Thêm Công việc
                            </Button>
                          </Box>
                        )}
                      </Collapse>
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
              p: 2,
              bgcolor: isDarkMode ? "#1e1e2f" : "#f7f7f7",
              borderRadius: 2,
              fontStyle: "italic",
              textAlign: "center",
              fontSize: "0.85rem",
            }}
          >
            Chưa có Danh sách nào. Hãy thêm một danh sách mới!
          </Typography>
        )}

        {/* Thêm checklist mới */}
        {canPerformActions && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mt: 2,
              p: { xs: 1.5, sm: 2 },
              bgcolor: isDarkMode ? "#1e1e2f" : "#ffffff",
              borderRadius: 2,
              boxShadow: isDarkMode ? "0 4px 12px rgba(0, 0, 0, 0.25)" : "0 4px 12px rgba(0, 0, 0, 0.06)",
            }}
          >
            <CheckCircleOutlineIcon sx={{ color: theme.palette.primary.main, fontSize: 20, flexShrink: 0 }} />
            <TextField
              fullWidth
              size="small"
              placeholder="Thêm tiêu đề Danh sách..."
              value={checklistTitle}
              onChange={(e) => setChecklistTitle(e.target.value)}
              variant="outlined"
              disabled={loading.checklist}
              error={checklistTitle !== "" && !checklistTitle?.trim()}
              helperText={checklistTitle !== "" && !checklistTitle?.trim() ? "Tiêu đề không được để trống" : ""}
              sx={styles.textField}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleAddChecklistWrapper}
              disabled={loading.checklist || !checklistTitle.trim()}
              startIcon={<AddCircleOutlineIcon fontSize="small" />}
              sx={{ ...styles.button, flexShrink: 0 }}
            >
              {loading.checklist ? <CircularProgress size={16} color="inherit" /> : "Thêm"}
            </Button>
          </Box>
        )}
      </Collapse>

      {/* Dialog xác nhận xóa */}
      <Dialog open={deleteConfirm.open} onClose={handleCloseConfirm} sx={{ "& .MuiDialog-paper": styles.dialogPaper }}>
        <DialogTitle sx={{ fontWeight: 500, fontSize: "1.1rem", p: 2 }}>Xác nhận xóa</DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Typography sx={{ color: isDarkMode ? theme.palette.grey[200] : theme.palette.text.primary, fontSize: "0.9rem" }}>
            Bạn có chắc muốn xóa {deleteConfirm.type === "checklist" ? "checklist" : "item"} này?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseConfirm}
            sx={{ color: isDarkMode ? theme.palette.grey[400] : theme.palette.text.secondary, textTransform: "none", fontSize: "0.8rem" }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleDelete}
            sx={{ color: theme.palette.error.main, textTransform: "none", fontSize: "0.8rem" }}
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog chỉnh sửa item */}
      <Dialog
        open={editItem.checklistId !== null && editItem.itemId !== null}
        onClose={() => setEditItem({ checklistId: null, itemId: null, title: "", content: "" })}
        sx={{ "& .MuiDialog-paper": styles.dialogPaper }}
      >
        <DialogTitle sx={{ fontWeight: 500, fontSize: "1.1rem", p: 2 }}>Chỉnh sửa Item</DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Tiêu đề"
            value={editItem.title}
            onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
            variant="outlined"
            disabled={loading.checklistItem}
            error={editItem.title !== "" && !editItem.title?.trim()}
            helperText={editItem.title !== "" && !editItem.title?.trim() ? "Tiêu đề không được để trống" : ""}
            sx={{ ...styles.textField, mt: 1 }}
          />
          <TextField
            fullWidth
            size="small"
            label="Nội dung"
            value={editItem.content}
            onChange={(e) => setEditItem({ ...editItem, content: e.target.value.slice(0, 300) })}
            variant="outlined"
            multiline
            rows={2}
            disabled={loading.checklistItem}
            error={editItem.content !== "" && !editItem.content?.trim()}
            helperText={editItem.content !== "" && !editItem.content?.trim() ? "Nội dung không được để trống" : ""}
            inputProps={{ maxLength: 300 }}
            sx={{ ...styles.textField, mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setEditItem({ checklistId: null, itemId: null, title: "", content: "" })}
            sx={{ color: isDarkMode ? theme.palette.grey[400] : theme.palette.text.secondary, textTransform: "none", fontSize: "0.8rem" }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmitEditItem}
            disabled={loading.checklistItem || !editItem.title.trim() || !editItem.content.trim()}
            sx={{ color: theme.palette.primary.main, textTransform: "none", fontSize: "0.8rem" }}
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
            ...styles.dialogPaper,
            maxWidth: { xs: "85%", sm: 500 },
            maxHeight: "70vh",
            width: "100%",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 500, fontSize: "1.1rem", p: 2 }}>Chi tiết Item</DialogTitle>
        <DialogContent sx={{ maxHeight: 300, overflowY: "auto", overflowX: "hidden", p: 2 }}>
          <Typography
            sx={{
              fontWeight: 450,
              fontSize: "0.9rem",
              color: isDarkMode ? theme.palette.grey[200] : theme.palette.text.primary,
              mb: 1,
              wordBreak: "break-word",
            }}
          >
            {viewItem.title || "Công việc không có tiêu đề"}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.8rem",
              color: isDarkMode ? theme.palette.grey[400] : theme.palette.text.secondary,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              "&::-webkit-scrollbar": { width: "4px" },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: isDarkMode ? "#555" : "#ccc",
                borderRadius: "2px",
              },
            }}
          >
            {viewItem.content || "Không có nội dung"}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={closeViewItem}
            sx={{ color: isDarkMode ? theme.palette.grey[400] : theme.palette.text.secondary, textTransform: "none", fontSize: "0.8rem" }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChecklistsSection;