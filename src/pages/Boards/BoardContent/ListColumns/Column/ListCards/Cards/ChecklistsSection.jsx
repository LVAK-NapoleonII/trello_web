import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useState } from "react";

const ChecklistsSection = ({
  checklists,
  checklistTitle,
  setChecklistTitle,
  checklistItem,
  setChecklistItem,
  loading,
  handleAddChecklist,
  handleAddChecklistItem,
  handleToggleChecklistItem,
  handleEditChecklist, // Thêm prop
  handleDeleteChecklist, // Thêm prop
  handleEditChecklistItem, // Thêm prop
  handleDeleteChecklistItem, // Thêm prop
}) => {
  const [editChecklistIndex, setEditChecklistIndex] = useState(null);
  const [editChecklistTitle, setEditChecklistTitle] = useState("");
  const [editItem, setEditItem] = useState({
    checklistIndex: null,
    itemIndex: null,
    text: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    type: "",
    checklistIndex: null,
    itemIndex: null,
  });

  const openEditChecklist = (index, title) => {
    setEditChecklistIndex(index);
    setEditChecklistTitle(title);
  };

  const openEditItem = (checklistIndex, itemIndex, text) => {
    setEditItem({ checklistIndex, itemIndex, text });
  };

  const handleConfirmDelete = (type, checklistIndex, itemIndex = null) => {
    setDeleteConfirm({ open: true, type, checklistIndex, itemIndex });
  };

  const handleCloseConfirm = () => {
    setDeleteConfirm({
      open: false,
      type: "",
      checklistIndex: null,
      itemIndex: null,
    });
  };

  const handleSubmitEditChecklist = async (index) => {
    if (!editChecklistTitle.trim()) {
      toast.error("Tiêu đề checklist không được để trống!");
      return;
    }
    await handleEditChecklist(index, editChecklistTitle);
    setEditChecklistIndex(null);
    setEditChecklistTitle("");
  };

  const handleSubmitEditItem = async () => {
    if (!editItem.text.trim()) {
      toast.error("Nội dung item không được để trống!");
      return;
    }
    await handleEditChecklistItem(
      editItem.checklistIndex,
      editItem.itemIndex,
      editItem.text
    );
    setEditItem({ checklistIndex: null, itemIndex: null, text: "" });
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" color="text.primary" gutterBottom>
        Checklists
      </Typography>
      {checklists?.length > 0 && (
        <>
          {checklists.map((checklist, checklistIndex) => (
            <Box key={checklistIndex} sx={{ mb: 3, pl: 2 }}>
              {editChecklistIndex === checklistIndex ? (
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    value={editChecklistTitle}
                    onChange={(e) => setEditChecklistTitle(e.target.value)}
                    variant="outlined"
                    disabled={loading.checklist}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleSubmitEditChecklist(checklistIndex)}
                    disabled={loading.checklist || !editChecklistTitle.trim()}
                  >
                    Lưu
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setEditChecklistIndex(null)}
                  >
                    Hủy
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    variant="body1"
                    fontWeight="medium"
                    color="text.primary"
                    gutterBottom
                  >
                    {checklist.title || "Checklist không có tiêu đề"}
                  </Typography>
                  <IconButton
                    onClick={() =>
                      openEditChecklist(checklistIndex, checklist.title)
                    }
                    size="small"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={() =>
                      handleConfirmDelete("checklist", checklistIndex)
                    }
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
              <List dense>
                {(checklist.items || []).map((item, itemIndex) => (
                  <ListItem
                    key={itemIndex}
                    sx={{ py: 0 }}
                    secondaryAction={
                      <>
                        <Checkbox
                          edge="end"
                          checked={item.completed || false}
                          onChange={() =>
                            handleToggleChecklistItem(checklistIndex, itemIndex)
                          }
                          disabled={loading.checklistToggle}
                          color="success"
                        />
                        <IconButton
                          onClick={() =>
                            openEditItem(checklistIndex, itemIndex, item.text)
                          }
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() =>
                            handleConfirmDelete(
                              "item",
                              checklistIndex,
                              itemIndex
                            )
                          }
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    }
                  >
                    <ListItemText
                      primary={
                        editItem.checklistIndex === checklistIndex &&
                        editItem.itemIndex === itemIndex ? (
                          <TextField
                            fullWidth
                            size="small"
                            value={editItem.text}
                            onChange={(e) =>
                              setEditItem({ ...editItem, text: e.target.value })
                            }
                            variant="outlined"
                            disabled={loading.checklistItem}
                          />
                        ) : (
                          item.text || "Item không có nội dung"
                        )
                      }
                      sx={{
                        textDecoration: item.completed
                          ? "line-through"
                          : "none",
                        color: "text.primary",
                      }}
                    />
                  </ListItem>
                ))}
                {editItem.checklistIndex === checklistIndex &&
                  editItem.itemIndex !== null && (
                    <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleSubmitEditItem}
                        disabled={
                          loading.checklistItem || !editItem.text.trim()
                        }
                      >
                        Lưu
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          setEditItem({
                            checklistIndex: null,
                            itemIndex: null,
                            text: "",
                          })
                        }
                      >
                        Hủy
                      </Button>
                    </Box>
                  )}
              </List>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}
              >
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Thêm item checklist..."
                  value={checklistItem}
                  onChange={(e) => setChecklistItem(e.target.value)}
                  variant="outlined"
                  disabled={loading.checklistItem}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "background.default",
                      borderRadius: 2,
                      "& fieldset": { borderColor: "divider" },
                      "&:hover fieldset": { borderColor: "text.secondary" },
                    },
                  }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleAddChecklistItem(checklistIndex)}
                  disabled={loading.checklistItem || !checklistItem.trim()}
                  sx={{
                    bgcolor: "primary.main",
                    "&:hover": { bgcolor: "primary.dark" },
                  }}
                >
                  {loading.checklistItem ? (
                    <CircularProgress size={20} />
                  ) : (
                    "Thêm"
                  )}
                </Button>
              </Box>
            </Box>
          ))}
        </>
      )}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CheckCircleIcon fontSize="small" color="action" />
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
              bgcolor: "background.default",
              borderRadius: 2,
              "& fieldset": { borderColor: "divider" },
              "&:hover fieldset": { borderColor: "text.secondary" },
            },
          }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={handleAddChecklist}
          disabled={loading.checklist || !checklistTitle.trim()}
          sx={{
            bgcolor: "primary.main",
            "&:hover": { bgcolor: "primary.dark" },
          }}
        >
          {loading.checklist ? (
            <CircularProgress size={20} />
          ) : (
            "Thêm Checklist"
          )}
        </Button>
      </Box>

      {/* Dialog xác nhận xóa */}
      <Dialog open={deleteConfirm.open} onClose={handleCloseConfirm}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc muốn xóa{" "}
            {deleteConfirm.type === "checklist" ? "checklist" : "item"} này?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm}>Hủy</Button>
          <Button
            onClick={() => {
              if (deleteConfirm.type === "checklist") {
                handleDeleteChecklist(deleteConfirm.checklistIndex);
              } else {
                handleDeleteChecklistItem(
                  deleteConfirm.checklistIndex,
                  deleteConfirm.itemIndex
                );
              }
              handleCloseConfirm();
            }}
            color="error"
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChecklistsSection;
