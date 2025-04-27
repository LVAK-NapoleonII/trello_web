import { useState } from "react";
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
import { toast } from "react-toastify";
import { useTheme } from "@mui/material/styles";

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
  handleEditChecklist,
  handleDeleteChecklist,
  handleEditChecklistItem,
  handleDeleteChecklistItem,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
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

  if (!Array.isArray(checklists)) {
    console.warn("Checklists không phải là mảng:", checklists);
  } else {
    checklists.forEach((checklist, index) => {
      if (
        !checklist ||
        typeof checklist !== "object" ||
        !Array.isArray(checklist.items)
      ) {
        console.warn(`Checklist tại index ${index} không hợp lệ:`, checklist);
      }
    });
  }

  const openEditChecklist = (index, title) => {
    setEditChecklistIndex(index);
    setEditChecklistTitle(title || "");
  };

  const openEditItem = (checklistIndex, itemIndex, text) => {
    setEditItem({ checklistIndex, itemIndex, text: text || "" });
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
      <Typography
        variant="h6"
        sx={{
          color: isDarkMode
            ? theme.palette.grey[200]
            : theme.palette.text.primary,
          mb: 1,
        }}
      >
        Checklists
      </Typography>
      {Array.isArray(checklists) && checklists.length > 0 ? (
        <>
          {checklists.map((checklist, checklistIndex) => {
            if (!checklist || typeof checklist !== "object") {
              return (
                <Typography
                  key={checklistIndex}
                  color="error"
                  sx={{ pl: 2, mb: 2 }}
                >
                  Checklist không hợp lệ tại index {checklistIndex}
                </Typography>
              );
            }

            return (
              <Box key={checklist._id || checklistIndex} sx={{ mb: 3, pl: 2 }}>
                {editChecklistIndex === checklistIndex ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      value={editChecklistTitle}
                      onChange={(e) => setEditChecklistTitle(e.target.value)}
                      variant="outlined"
                      disabled={loading.checklist}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          bgcolor: isDarkMode
                            ? "rgba(255, 255, 255, 0.05)"
                            : theme.palette.background.default,
                          borderRadius: 2,
                          "& fieldset": {
                            borderColor: isDarkMode
                              ? theme.palette.grey[600]
                              : theme.palette.divider,
                          },
                          "&:hover fieldset": {
                            borderColor: isDarkMode
                              ? theme.palette.grey[500]
                              : theme.palette.text.secondary,
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: theme.palette.primary.main,
                          },
                        },
                        "& .MuiInputBase-input": {
                          color: isDarkMode
                            ? theme.palette.grey[200]
                            : theme.palette.text.primary,
                        },
                      }}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleSubmitEditChecklist(checklistIndex)}
                      disabled={loading.checklist || !editChecklistTitle.trim()}
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        "&:hover": {
                          bgcolor: theme.palette.primary.dark,
                        },
                      }}
                    >
                      Lưu
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setEditChecklistIndex(null)}
                      sx={{
                        color: isDarkMode
                          ? theme.palette.grey[400]
                          : theme.palette.text.secondary,
                        borderColor: isDarkMode
                          ? theme.palette.grey[600]
                          : theme.palette.divider,
                      }}
                    >
                      Hủy
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="body1"
                      fontWeight="medium"
                      sx={{
                        color: isDarkMode
                          ? theme.palette.grey[200]
                          : theme.palette.text.primary,
                      }}
                    >
                      {checklist.title || "Checklist không có tiêu đề"}
                    </Typography>
                    <IconButton
                      onClick={() =>
                        openEditChecklist(checklistIndex, checklist.title)
                      }
                      size="small"
                    >
                      <EditIcon
                        fontSize="small"
                        sx={{
                          color: isDarkMode
                            ? theme.palette.grey[400]
                            : theme.palette.text.secondary,
                        }}
                      />
                    </IconButton>
                    <IconButton
                      onClick={() =>
                        handleConfirmDelete("checklist", checklistIndex)
                      }
                      size="small"
                    >
                      <DeleteIcon
                        fontSize="small"
                        sx={{
                          color: theme.palette.error.main,
                        }}
                      />
                    </IconButton>
                  </Box>
                )}
                {Array.isArray(checklist.items) ? (
                  <List dense>
                    {checklist.items.map((item, itemIndex) => (
                      <ListItem
                        key={item._id || itemIndex}
                        sx={{ py: 0 }}
                        secondaryAction={
                          <>
                            <Checkbox
                              edge="end"
                              checked={item.completed || false}
                              onChange={() =>
                                handleToggleChecklistItem(
                                  checklistIndex,
                                  itemIndex
                                )
                              }
                              disabled={loading.checklistToggle}
                              color="success"
                            />
                            <IconButton
                              onClick={() =>
                                openEditItem(
                                  checklistIndex,
                                  itemIndex,
                                  item.text
                                )
                              }
                              size="small"
                            >
                              <EditIcon
                                fontSize="small"
                                sx={{
                                  color: isDarkMode
                                    ? theme.palette.grey[400]
                                    : theme.palette.text.secondary,
                                }}
                              />
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
                              <DeleteIcon
                                fontSize="small"
                                sx={{
                                  color: theme.palette.error.main,
                                }}
                              />
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
                                  setEditItem({
                                    ...editItem,
                                    text: e.target.value,
                                  })
                                }
                                variant="outlined"
                                disabled={loading.checklistItem}
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    bgcolor: isDarkMode
                                      ? "rgba(255, 255, 255, 0.05)"
                                      : theme.palette.background.default,
                                    borderRadius: 2,
                                    "& fieldset": {
                                      borderColor: isDarkMode
                                        ? theme.palette.grey[600]
                                        : theme.palette.divider,
                                    },
                                    "&:hover fieldset": {
                                      borderColor: isDarkMode
                                        ? theme.palette.grey[500]
                                        : theme.palette.text.secondary,
                                    },
                                    "&.Mui-focused fieldset": {
                                      borderColor: theme.palette.primary.main,
                                    },
                                  },
                                  "& .MuiInputBase-input": {
                                    color: isDarkMode
                                      ? theme.palette.grey[200]
                                      : theme.palette.text.primary,
                                  },
                                }}
                              />
                            ) : (
                              item.text || "Item không có nội dung"
                            )
                          }
                          sx={{
                            textDecoration: item.completed
                              ? "line-through"
                              : "none",
                            color: isDarkMode
                              ? theme.palette.grey[200]
                              : theme.palette.text.primary,
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
                            sx={{
                              bgcolor: theme.palette.primary.main,
                              "&:hover": {
                                bgcolor: theme.palette.primary.dark,
                              },
                            }}
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
                            sx={{
                              color: isDarkMode
                                ? theme.palette.grey[400]
                                : theme.palette.text.secondary,
                              borderColor: isDarkMode
                                ? theme.palette.grey[600]
                                : theme.palette.divider,
                            }}
                          >
                            Hủy
                          </Button>
                        </Box>
                      )}
                  </List>
                ) : (
                  <Typography
                    sx={{
                      color: isDarkMode
                        ? theme.palette.grey[400]
                        : theme.palette.text.secondary,
                      pl: 2,
                      mt: 1,
                    }}
                  >
                    Không có item trong checklist này.
                  </Typography>
                )}
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
                        bgcolor: isDarkMode
                          ? "rgba(255, 255, 255, 0.05)"
                          : theme.palette.background.default,
                        borderRadius: 2,
                        "& fieldset": {
                          borderColor: isDarkMode
                            ? theme.palette.grey[600]
                            : theme.palette.divider,
                        },
                        "&:hover fieldset": {
                          borderColor: isDarkMode
                            ? theme.palette.grey[500]
                            : theme.palette.text.secondary,
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                      "& .MuiInputBase-input": {
                        color: isDarkMode
                          ? theme.palette.grey[200]
                          : theme.palette.text.primary,
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleAddChecklistItem(checklistIndex)}
                    disabled={loading.checklistItem || !checklistItem.trim()}
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      "&:hover": {
                        bgcolor: theme.palette.primary.dark,
                      },
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
            );
          })}
        </>
      ) : (
        <Typography
          sx={{
            color: isDarkMode
              ? theme.palette.grey[400]
              : theme.palette.text.secondary,
            mb: 2,
          }}
        >
          Chưa có checklist nào.
        </Typography>
      )}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CheckCircleIcon
          fontSize="small"
          sx={{
            color: isDarkMode
              ? theme.palette.grey[400]
              : theme.palette.action.active,
          }}
        />
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
              bgcolor: isDarkMode
                ? "rgba(255, 255, 255, 0.05)"
                : theme.palette.background.default,
              borderRadius: 2,
              "& fieldset": {
                borderColor: isDarkMode
                  ? theme.palette.grey[600]
                  : theme.palette.divider,
              },
              "&:hover fieldset": {
                borderColor: isDarkMode
                  ? theme.palette.grey[500]
                  : theme.palette.text.secondary,
              },
              "&.Mui-focused fieldset": {
                borderColor: theme.palette.primary.main,
              },
            },
            "& .MuiInputBase-input": {
              color: isDarkMode
                ? theme.palette.grey[200]
                : theme.palette.text.primary,
            },
          }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={handleAddChecklist}
          disabled={loading.checklist || !checklistTitle.trim()}
          sx={{
            bgcolor: theme.palette.primary.main,
            "&:hover": {
              bgcolor: theme.palette.primary.dark,
            },
          }}
        >
          {loading.checklist ? (
            <CircularProgress size={20} />
          ) : (
            "Thêm Checklist"
          )}
        </Button>
      </Box>

      <Dialog
        open={deleteConfirm.open}
        onClose={handleCloseConfirm}
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "12px",
            bgcolor: isDarkMode ? "#2a2a3d" : theme.palette.background.paper,
            color: isDarkMode
              ? theme.palette.grey[200]
              : theme.palette.text.primary,
          },
        }}
      >
        <DialogTitle
          sx={{
            color: isDarkMode
              ? theme.palette.grey[100]
              : theme.palette.text.primary,
          }}
        >
          Xác nhận xóa
        </DialogTitle>
        <DialogContent>
          <Typography
            sx={{
              color: isDarkMode
                ? theme.palette.grey[200]
                : theme.palette.text.primary,
            }}
          >
            Bạn có chắc muốn xóa{" "}
            {deleteConfirm.type === "checklist" ? "checklist" : "item"} này?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseConfirm}
            sx={{
              color: isDarkMode
                ? theme.palette.grey[400]
                : theme.palette.text.secondary,
            }}
          >
            Hủy
          </Button>
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
            sx={{
              color: theme.palette.error.main,
            }}
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChecklistsSection;
