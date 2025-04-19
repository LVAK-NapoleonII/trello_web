import { useState, useContext } from "react";
import {
  Box,
  Collapse,
  Typography,
  IconButton,
  Divider,
  TextField,
  Button,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
} from "@mui/material";
import CommentIcon from "@mui/icons-material/Comment";
import PersonIcon from "@mui/icons-material/Person";
import LabelIcon from "@mui/icons-material/Label";
import NoteIcon from "@mui/icons-material/Note";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axios from "axios";
import { toast } from "react-toastify";
import AddMemberDialog from "./AddMemberDialog";
import { SocketContext } from "../../../../../../../context/SocketContext";

function CardDetails({
  card,
  setCards,
  setColumns,
  expanded,
  setExpanded,
  boardMembers,
}) {
  const { socket } = useContext(SocketContext);
  const [comment, setComment] = useState("");
  const [note, setNote] = useState("");
  const [checklistTitle, setChecklistTitle] = useState("");
  const [checklistItem, setChecklistItem] = useState("");
  const [openAddMemberDialog, setOpenAddMemberDialog] = useState(false);

  console.log("boardMembers:", boardMembers);
  console.log("card.members:", card.members);

  const isMemberInBoard = (memberId) => {
    if (!memberId) return false;
    return (boardMembers || []).some(
      (boardMember) =>
        boardMember.user?._id?.toString() === memberId.toString() &&
        boardMember.isActive
    );
  };

  const handleAddComment = async () => {
    if (!comment.trim()) {
      toast.error("Bình luận không được để trống!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/cards/${card._id}/comments`,
        { text: comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCards((prevCards) =>
        prevCards.map((c) =>
          c._id === card._id
            ? { ...c, comments: [...(c.comments || []), response.data] }
            : c
        )
      );

      setColumns((prevColumns) =>
        prevColumns.map((col) => ({
          ...col,
          cards: col.cards.map((c) =>
            c._id === card._id
              ? { ...c, comments: [...(c.comments || []), response.data] }
              : c
          ),
        }))
      );

      if (socket) {
        socket.emit("comment-added", {
          cardId: card._id,
          comment: response.data,
        });
      }

      setComment("");
      toast.success("Thêm bình luận thành công!");
    } catch (err) {
      console.error("Error adding comment:", err);
      toast.error(
        `Có lỗi khi thêm bình luận: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) {
      toast.error("Ghi chú không được để trống!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/cards/${card._id}/notes`,
        { content: note },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCards((prevCards) =>
        prevCards.map((c) =>
          c._id === card._id
            ? { ...c, notes: [...(c.notes || []), response.data] }
            : c
        )
      );

      setColumns((prevColumns) =>
        prevColumns.map((col) => ({
          ...col,
          cards: col.cards.map((c) =>
            c._id === card._id
              ? { ...c, notes: [...(c.notes || []), response.data] }
              : c
          ),
        }))
      );

      if (socket) {
        socket.emit("note-added", { cardId: card._id, note: response.data });
      }

      setNote("");
      toast.success("Thêm ghi chú thành công!");
    } catch (err) {
      console.error("Error adding note:", err);
      toast.error(
        `Có lỗi khi thêm ghi chú: ${err.response?.data?.message || err.message}`
      );
    }
  };

  const handleAddChecklist = async () => {
    if (!checklistTitle.trim()) {
      toast.error("Tiêu đề checklist không được để trống!");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/cards/${card._id}/checklists`,
        { title: checklistTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newChecklist = response.data;
      setCards((prevCards) =>
        prevCards.map((c) =>
          c._id === card._id
            ? { ...c, checklists: [...(c.checklists || []), newChecklist] }
            : c
        )
      );
      setColumns((prevColumns) =>
        prevColumns.map((col) => ({
          ...col,
          cards: col.cards.map((c) =>
            c._id === card._id
              ? { ...c, checklists: [...(c.checklists || []), newChecklist] }
              : c
          ),
        }))
      );
      if (socket) {
        socket.emit("checklist-added", {
          cardId: card._id,
          checklist: newChecklist,
        });
      }
      setChecklistTitle("");
      toast.success("Thêm checklist thành công!");
    } catch (err) {
      console.error("Error adding checklist:", err);
      toast.error(
        `Có lỗi khi thêm checklist: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  const handleAddChecklistItem = async (checklistIndex) => {
    if (!checklistItem.trim()) {
      toast.error("Item checklist không được để trống!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/cards/${card._id}/checklists/${checklistIndex}/items`,
        { text: checklistItem },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedChecklist = response.data;
      setCards((prevCards) =>
        prevCards.map((c) =>
          c._id === card._id
            ? {
                ...c,
                checklists: (c.checklists || []).map((cl, idx) =>
                  idx === checklistIndex ? updatedChecklist : cl
                ),
              }
            : c
        )
      );

      setColumns((prevColumns) =>
        prevColumns.map((col) => ({
          ...col,
          cards: col.cards.map((c) =>
            c._id === card._id
              ? {
                  ...c,
                  checklists: (c.checklists || []).map((cl, idx) =>
                    idx === checklistIndex ? updatedChecklist : cl
                  ),
                }
              : c
          ),
        }))
      );

      if (socket) {
        socket.emit("checklist-item-added", {
          cardId: card._id,
          checklistIndex,
          checklist: updatedChecklist,
        });
      }

      setChecklistItem("");
      toast.success("Thêm item checklist thành công!");
    } catch (err) {
      console.error("Error adding checklist item:", err);
      toast.error(
        `Có lỗi khi thêm item checklist: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  const handleToggleChecklistItem = async (checklistIndex, itemIndex) => {
    if (!card.checklists?.[checklistIndex]?.items?.[itemIndex]) {
      toast.error("Checklist item không tồn tại!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      console.log("Toggling checklist item:", {
        cardId: card._id,
        checklistIndex,
        itemIndex,
      });
      const response = await axios.put(
        `http://localhost:5000/api/cards/${card._id}/checklists/${checklistIndex}/items/${itemIndex}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedChecklist = response.data;
      setCards((prevCards) =>
        prevCards.map((c) =>
          c._id === card._id
            ? {
                ...c,
                checklists: (c.checklists || []).map((cl, idx) =>
                  idx === checklistIndex ? updatedChecklist : cl
                ),
              }
            : c
        )
      );

      setColumns((prevColumns) =>
        prevColumns.map((col) => ({
          ...col,
          cards: col.cards.map((c) =>
            c._id === card._id
              ? {
                  ...c,
                  checklists: (c.checklists || []).map((cl, idx) =>
                    idx === checklistIndex ? updatedChecklist : cl
                  ),
                }
              : c
          ),
        }))
      );

      if (socket) {
        socket.emit("checklist-item-toggled", {
          cardId: card._id,
          checklistIndex,
          checklist: updatedChecklist,
        });
      }

      toast.success("Cập nhật trạng thái item checklist thành công!");
    } catch (err) {
      console.error("Error toggling checklist item:", err);
      toast.error(
        `Có lỗi khi cập nhật trạng thái item checklist: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  return (
    <Collapse in={expanded} timeout="auto" unmountOnExit>
      <Box
        sx={{
          p: 2,
          bgcolor: (theme) => theme.palette.background.paper,
          borderRadius: 1,
          maxHeight: "300px",
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? theme.palette.grey[200]
                : theme.palette.grey[800],
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? theme.palette.grey[400]
                : theme.palette.grey[600],
            borderRadius: "10px",
            "&:hover": {
              backgroundColor: (theme) =>
                theme.palette.mode === "light"
                  ? theme.palette.grey[500]
                  : theme.palette.grey[500],
            },
          },
        }}
      >
        {/* Mô tả */}
        {card.description && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              color={(theme) => theme.palette.text.primary}
              gutterBottom
            >
              Mô tả
            </Typography>
            <Typography
              variant="body2"
              color={(theme) => theme.palette.text.secondary}
            >
              {card.description}
            </Typography>
          </Box>
        )}

        {/* Hạn chót */}
        {card.dueDate && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              color={(theme) => theme.palette.text.primary}
              gutterBottom
            >
              Hạn chót
            </Typography>
            <Typography
              variant="body2"
              color={(theme) => theme.palette.text.secondary}
            >
              {new Date(card.dueDate).toLocaleString()}
            </Typography>
          </Box>
        )}

        {/* Thành viên */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <PersonIcon
              fontSize="small"
              sx={{ color: (theme) => theme.palette.action.active }}
            />
            <Typography
              variant="subtitle2"
              color={(theme) => theme.palette.text.primary}
            >
              Thành viên
            </Typography>
          </Box>
          {(card.members || []).length > 0 ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
              {(card.members || []).map((member, index) => (
                <Chip
                  key={member._id || index}
                  label={member.fullName || member.email || "Không xác định"}
                  size="small"
                  sx={{
                    bgcolor: (theme) =>
                      theme.palette.mode === "light"
                        ? theme.palette.info.light
                        : theme.palette.info.dark,
                    color: (theme) => theme.palette.info.contrastText,
                    textDecoration: !isMemberInBoard(member._id)
                      ? "line-through"
                      : "none",
                  }}
                />
              ))}
            </Stack>
          ) : (
            <Typography
              variant="body2"
              color={(theme) => theme.palette.text.secondary}
            >
              Chưa có thành viên
            </Typography>
          )}
          <Button
            size="small"
            onClick={() => setOpenAddMemberDialog(true)}
            variant="outlined"
            sx={{
              mt: 1,
              color: (theme) => theme.palette.text.primary,
              borderColor: (theme) => theme.palette.divider,
              "&:hover": {
                borderColor: (theme) => theme.palette.text.primary,
                bgcolor: (theme) =>
                  theme.palette.mode === "light"
                    ? theme.palette.grey[100]
                    : theme.palette.grey[800],
              },
            }}
          >
            Thêm thành viên
          </Button>
        </Box>

        {/* Nhãn */}
        {(card.labels || []).length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <LabelIcon
                fontSize="small"
                sx={{ color: (theme) => theme.palette.action.active }}
              />
              <Typography
                variant="subtitle2"
                color={(theme) => theme.palette.text.primary}
              >
                Nhãn
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {(card.labels || []).map((label, index) => (
                <Chip
                  key={index}
                  label={label}
                  size="small"
                  sx={{
                    bgcolor: (theme) =>
                      theme.palette.mode === "light"
                        ? theme.palette.secondary.light
                        : theme.palette.secondary.dark,
                    color: (theme) => theme.palette.secondary.contrastText,
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Ghi chú */}
        {(card.notes || []).length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              color={(theme) => theme.palette.text.primary}
              gutterBottom
            >
              Ghi chú
            </Typography>
            <List dense>
              {(card.notes || []).map((note, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={note.content}
                    primaryTypographyProps={{
                      color: (theme) => theme.palette.text.primary,
                    }}
                    secondary={
                      <>
                        {new Date(note.createdAt).toLocaleString()} -{" "}
                        <span
                          style={{
                            textDecoration: !isMemberInBoard(
                              note.createdBy?._id
                            )
                              ? "line-through"
                              : "none",
                          }}
                        >
                          {note.createdBy?.fullName || "Không xác định"}
                        </span>
                      </>
                    }
                    secondaryTypographyProps={{
                      color: (theme) => theme.palette.text.secondary,
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
        <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <NoteIcon
            fontSize="small"
            sx={{ color: (theme) => theme.palette.action.active }}
          />
          <TextField
            fullWidth
            size="small"
            placeholder="Thêm ghi chú..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: (theme) =>
                  theme.palette.mode === "light"
                    ? theme.palette.background.default
                    : theme.palette.grey[900],
                "& fieldset": {
                  borderColor: (theme) => theme.palette.divider,
                },
                "&:hover fieldset": {
                  borderColor: (theme) => theme.palette.text.secondary,
                },
              },
              "& .MuiInputBase-input": {
                color: (theme) => theme.palette.text.primary,
              },
            }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleAddNote}
            disabled={!note.trim()}
            sx={{
              bgcolor: (theme) => theme.palette.primary.main,
              color: (theme) => theme.palette.primary.contrastText,
              "&:hover": {
                bgcolor: (theme) => theme.palette.primary.dark,
              },
              "&.Mui-disabled": {
                bgcolor: (theme) => theme.palette.action.disabledBackground,
                color: (theme) => theme.palette.action.disabled,
              },
            }}
          >
            Thêm
          </Button>
        </Box>

        {/* Checklist */}
        {(card.checklists || []).length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              color={(theme) => theme.palette.text.primary}
              gutterBottom
            >
              Checklists
            </Typography>
            {(card.checklists || []).map((checklist, checklistIndex) => (
              <Box key={checklistIndex} sx={{ mb: 2, pl: 2 }}>
                <Typography
                  variant="body2"
                  fontWeight="medium"
                  color={(theme) => theme.palette.text.primary}
                  gutterBottom
                >
                  {checklist.title || "Checklist không có tiêu đề"}
                </Typography>
                <List dense>
                  {(checklist.items || []).map((item, itemIndex) => (
                    <ListItem
                      key={itemIndex}
                      sx={{ py: 0 }}
                      secondaryAction={
                        <Checkbox
                          edge="end"
                          checked={item.completed || false}
                          onChange={() =>
                            handleToggleChecklistItem(checklistIndex, itemIndex)
                          }
                          sx={{
                            color: (theme) => theme.palette.action.active,
                            "&.Mui-checked": {
                              color: (theme) => theme.palette.success.main,
                            },
                          }}
                        />
                      }
                    >
                      <ListItemText
                        primary={item.text || "Item không có nội dung"}
                        sx={{
                          textDecoration: item.completed
                            ? "line-through"
                            : "none",
                          color: (theme) => theme.palette.text.primary,
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Thêm item checklist..."
                    value={checklistItem}
                    onChange={(e) => setChecklistItem(e.target.value)}
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: (theme) =>
                          theme.palette.mode === "light"
                            ? theme.palette.background.default
                            : theme.palette.grey[900],
                        "& fieldset": {
                          borderColor: (theme) => theme.palette.divider,
                        },
                        "&:hover fieldset": {
                          borderColor: (theme) => theme.palette.text.secondary,
                        },
                      },
                      "& .MuiInputBase-input": {
                        color: (theme) => theme.palette.text.primary,
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleAddChecklistItem(checklistIndex)}
                    disabled={!checklistItem.trim()}
                    sx={{
                      bgcolor: (theme) => theme.palette.primary.main,
                      color: (theme) => theme.palette.primary.contrastText,
                      "&:hover": {
                        bgcolor: (theme) => theme.palette.primary.dark,
                      },
                      "&.Mui-disabled": {
                        bgcolor: (theme) =>
                          theme.palette.action.disabledBackground,
                        color: (theme) => theme.palette.action.disabled,
                      },
                    }}
                  >
                    Thêm
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        )}
        <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <CheckCircleIcon
            fontSize="small"
            sx={{ color: (theme) => theme.palette.action.active }}
          />
          <TextField
            fullWidth
            size="small"
            placeholder="Thêm tiêu đề checklist..."
            value={checklistTitle}
            onChange={(e) => setChecklistTitle(e.target.value)}
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: (theme) =>
                  theme.palette.mode === "light"
                    ? theme.palette.background.default
                    : theme.palette.grey[900],
                "& fieldset": {
                  borderColor: (theme) => theme.palette.divider,
                },
                "&:hover fieldset": {
                  borderColor: (theme) => theme.palette.text.secondary,
                },
              },
              "& .MuiInputBase-input": {
                color: (theme) => theme.palette.text.primary,
              },
            }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleAddChecklist}
            disabled={!checklistTitle.trim()}
            sx={{
              bgcolor: (theme) => theme.palette.primary.main,
              color: (theme) => theme.palette.primary.contrastText,
              "&:hover": {
                bgcolor: (theme) => theme.palette.primary.dark,
              },
              "&.Mui-disabled": {
                bgcolor: (theme) => theme.palette.action.disabledBackground,
                color: (theme) => theme.palette.action.disabled,
              },
            }}
          >
            Thêm Checklist
          </Button>
        </Box>

        {/* Bình luận */}
        {(card.comments || []).length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              color={(theme) => theme.palette.text.primary}
              gutterBottom
            >
              Bình luận
            </Typography>
            <List dense>
              {(card.comments || []).map((comment, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={comment.text}
                    primaryTypographyProps={{
                      color: (theme) => theme.palette.text.primary,
                    }}
                    secondary={
                      <>
                        {new Date(comment.createdAt).toLocaleString()} -{" "}
                        <span
                          style={{
                            textDecoration: !isMemberInBoard(comment.user?._id)
                              ? "line-through"
                              : "none",
                          }}
                        >
                          {comment.user?.fullName || "Không xác định"}
                        </span>
                      </>
                    }
                    secondaryTypographyProps={{
                      color: (theme) => theme.palette.text.secondary,
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
        <Divider
          sx={{
            my: 2,
            bgcolor: (theme) => theme.palette.divider,
          }}
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CommentIcon
            fontSize="small"
            sx={{ color: (theme) => theme.palette.action.active }}
          />
          <TextField
            fullWidth
            size="small"
            placeholder="Viết bình luận..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: (theme) =>
                  theme.palette.mode === "light"
                    ? theme.palette.background.default
                    : theme.palette.grey[900],
                "& fieldset": {
                  borderColor: (theme) => theme.palette.divider,
                },
                "&:hover fieldset": {
                  borderColor: (theme) => theme.palette.text.secondary,
                },
              },
              "& .MuiInputBase-input": {
                color: (theme) => theme.palette.text.primary,
              },
            }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleAddComment}
            disabled={!comment.trim()}
            sx={{
              bgcolor: (theme) => theme.palette.primary.main,
              color: (theme) => theme.palette.primary.contrastText,
              "&:hover": {
                bgcolor: (theme) => theme.palette.primary.dark,
              },
              "&.Mui-disabled": {
                bgcolor: (theme) => theme.palette.action.disabledBackground,
                color: (theme) => theme.palette.action.disabled,
              },
            }}
          >
            Gửi
          </Button>
        </Box>

        <AddMemberDialog
          open={openAddMemberDialog}
          onClose={() => setOpenAddMemberDialog(false)}
          card={card}
          setCards={setCards}
          setColumns={setColumns}
        />
      </Box>
    </Collapse>
  );
}

export default CardDetails;
