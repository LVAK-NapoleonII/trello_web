// CreateCardDialog.jsx
import { useState, useContext, useCallback } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
} from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import { SocketContext } from "../../../../../../../context/SocketContext";
import { debounce } from "lodash";

const API_BASE_URL = "http://localhost:5000/api";

function CreateCardDialog({
    open,
    onClose,
    columnId,
    boardId,
    setColumns,
    socket,
    socketReady,
}) {
    const [newCardTitle, setNewCardTitle] = useState("");
    const [newCardDescription, setNewCardDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const normalizeCard = useCallback(
        (card) => ({
            _id: card._id || new Date().toISOString(),
            title: card.title || "Untitled Card",
            description: card.description || "",
            list: card.list || columnId,
            board: card.board || boardId,
            members: Array.isArray(card.members)
                ? card.members.map((m) => ({
                    _id: m._id || "unknown",
                    fullName: m.fullName || m.email || "Unknown User",
                    avatar: m.avatar || "",
                    email: m.email || "",
                }))
                : [],
            comments: Array.isArray(card.comments)
                ? card.comments.map((c) => ({
                    ...c,
                    user: {
                        _id: c.user?._id || "unknown",
                        fullName: c.user?.fullName || c.user?.email || "Unknown User",
                        avatar: c.user?.avatar || "",
                        email: c.user?.email || "",
                    },
                }))
                : [],
            notes: Array.isArray(card.notes)
                ? card.notes.map((n) => ({
                    ...n,
                    createdBy: {
                        _id: n.createdBy?._id || "unknown",
                        fullName: n.createdBy?.fullName || n.createdBy?.email || "Unknown User",
                        avatar: n.createdBy?.avatar || "",
                        email: n.createdBy?.email || "",
                    },
                }))
                : [],
            checklists: Array.isArray(card.checklists)
                ? card.checklists.map((cl) => ({
                    _id: cl._id || new Date().toISOString(),
                    title: cl.title || "Untitled Checklist",
                    items: Array.isArray(cl.items)
                        ? cl.items.map((item) => ({
                            _id: item._id || new Date().toISOString(),
                            text: item.text || "",
                            completed: !!item.completed,
                            createdAt: item.createdAt || new Date().toISOString(),
                        }))
                        : [],
                }))
                : [],
            completed: !!card.completed,
            createdAt: card.createdAt || new Date().toISOString(),
        }),
        [boardId, columnId]
    );

    // Debounce để hạn chế cập nhật state
    const debouncedSetNewCardTitle = useCallback(
        debounce((value) => setNewCardTitle(value), 300),
        []
    );
    const debouncedSetNewCardDescription = useCallback(
        debounce((value) => setNewCardDescription(value), 300),
        []
    );

    const getToken = useCallback(() => {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");
        return token;
    }, []);

    const handleCreateCard = useCallback(async () => {
        if (!newCardTitle.trim()) {
            toast.error("Tiêu đề thẻ không được để trống!");
            return;
        }
        if (!boardId || !columnId) {
            toast.error("Không tìm thấy boardId hoặc listId!");
            return;
        }

        setLoading(true);
        try {
            const token = getToken();
            const response = await axios.post(
                `${API_BASE_URL}/cards`,
                {
                    title: newCardTitle,
                    description: newCardDescription,
                    list: columnId,
                    board: boardId,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const newCard = normalizeCard(response.data);
            setColumns((prevColumns) =>
                prevColumns.map((col) =>
                    col._id === columnId
                        ? { ...col, cards: [...(col.cards || []), newCard] }
                        : col
                )
            );

            if (socket && socketReady) {
                socket.emit("card-created", {
                    boardId,
                    listId: columnId,
                    card: newCard,
                });
            }

            toast.success("Tạo thẻ thành công!");
            onClose();
        } catch (err) {
            console.error("Error creating card:", err);
            toast.error("Lỗi khi tạo thẻ!");
        } finally {
            setLoading(false);
        }
    }, [
        newCardTitle,
        newCardDescription,
        columnId,
        boardId,
        socket,
        socketReady,
        setColumns,
        normalizeCard,
        getToken,
        onClose,
    ]);

    const handleClose = useCallback(() => {
        setNewCardTitle("");
        setNewCardDescription("");
        onClose();
    }, [onClose]);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>Tạo thẻ mới</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Tiêu đề thẻ"
                    fullWidth
                    variant="outlined"
                    value={newCardTitle}
                    onChange={(e) => debouncedSetNewCardTitle(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === "Enter" && newCardTitle.trim()) {
                            handleCreateCard();
                        }
                    }}
                    disabled={loading}
                />
                <TextField
                    margin="dense"
                    label="Mô tả (tùy chọn)"
                    fullWidth
                    variant="outlined"
                    multiline
                    rows={3}
                    value={newCardDescription}
                    onChange={(e) => debouncedSetNewCardDescription(e.target.value)}
                    disabled={loading}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Hủy bỏ
                </Button>
                <Button
                    onClick={handleCreateCard}
                    disabled={!newCardTitle.trim() || loading}
                    variant="contained"
                >
                    {loading ? "Đang tạo..." : "Tạo thẻ"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default CreateCardDialog;