import { useState, useContext } from "react";
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

const API_BASE_URL = "http://localhost:5000/api";

const normalizeCard = (card, columnId, boardId) => ({
    _id: card._id,
    title: card.title || "Untitled Card",
    description: card.description || "",
    list: card.list || columnId,
    board: card.board || boardId,
    members: (card.members || []).map(m => ({
        _id: m._id,
        fullName: m.fullName || m.email || "Unknown",
        avatar: m.avatar || "",
        email: m.email || "",
    })),
    comments: [],
    notes: [],
    checklists: [],
    completed: !!card.completed,
    dueDate: card.dueDate || null,
    cover: card.cover || null,
    createdAt: card.createdAt,
});

function CreateCardDialog({
    open,
    onClose,
    columnId,
    boardId,
    setColumns,
}) {
    const { socket, socketReady } = useContext(SocketContext);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!title.trim()) return toast.error("Tiêu đề không được trống!");

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.post(
                `${API_BASE_URL}/cards`,
                { title: title.trim(), description: description.trim() || null, list: columnId, board: boardId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const newCard = normalizeCard(data, columnId, boardId);

            setColumns(prev => prev.map(col =>
                col._id === columnId
                    ? { ...col, cards: [...(col.cards || []), newCard] }
                    : col
            ));

            if (socket && socketReady) {
                socket.emit("card-created", { boardId, listId: columnId, card: newCard });
            }

            toast.success("Tạo thẻ thành công!");
            handleClose();
        } catch (err) {
            toast.error("Lỗi tạo thẻ!");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setTitle("");
        setDescription("");
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            keepMounted={false}
            key={columnId}
        >
            <DialogTitle>Tạo thẻ mới</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Tiêu đề thẻ"
                    fullWidth
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && title.trim() && handleCreate()}
                    disabled={loading}
                    variant="outlined"
                />
                <TextField
                    margin="dense"
                    label="Mô tả (tùy chọn)"
                    fullWidth
                    multiline
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    variant="outlined"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Hủy
                </Button>
                <Button
                    onClick={handleCreate}
                    variant="contained"
                    disabled={!title.trim() || loading}
                >
                    {loading ? "Đang tạo..." : "Tạo thẻ"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default CreateCardDialog;