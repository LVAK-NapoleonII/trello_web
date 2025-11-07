import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from "@mui/material";

function EditColumnTitleDialog({
    open,
    onClose,
    title,
    onTitleChange,
    onSave,
    loading,
}) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Sửa tiêu đề cột</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Tiêu đề cột"
                    fullWidth
                    variant="outlined"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === "Enter" && title.trim()) onSave();
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Hủy</Button>
                <Button onClick={onSave} disabled={!title.trim() || loading} variant="contained">
                    {loading ? "Đang lưu..." : "Lưu"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default EditColumnTitleDialog;