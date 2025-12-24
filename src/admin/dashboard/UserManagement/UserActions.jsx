import { useState } from 'react';
import {
    IconButton, Tooltip, Menu, MenuItem,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, FormControl, InputLabel, Select,
    Box, Typography
} from '@mui/material';
import {
    Visibility, AdminPanelSettings, Block, Delete, Restore, MoreVert
} from '@mui/icons-material';
import { adminApi } from '../../api/adminApi';

export const UserActions = ({ user, onUpdate, onView }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [banDialog, setBanDialog] = useState(false);
    const [banData, setBanData] = useState({
        reason: '',
        duration: null // null = permanent
    });

    const handleAction = async (action) => {
        try {
            if (action === 'admin') {
                await adminApi.updateAdmin(user._id, !user.isAdmin);
                onUpdate();
            }
            if (action === 'ban') {
                setBanDialog(true);
                return;
            }
            if (action === 'unban') {
                await adminApi.unbanUser(user._id);
                onUpdate();
            }
            if (action === 'delete') {
                if (window.confirm('Xóa vĩnh viễn?')) {
                    await adminApi.deleteUser(user._id, true);
                    onUpdate();
                }
            }
            if (action === 'restore') {
                await adminApi.restoreUser(user._id);
                onUpdate();
            }
        } catch (err) {
            alert('Lỗi thực hiện hành động');
        }
        setAnchorEl(null);
    };

    const handleBanConfirm = async () => {
        if (!banData.reason.trim()) {
            alert('Vui lòng nhập lý do ban');
            return;
        }
        try {
            await adminApi.banUser(user._id, banData.reason, banData.duration);
            setBanDialog(false);
            setBanData({ reason: '', duration: null });
            onUpdate();
        } catch (err) {
            alert('Lỗi ban user');
        }
    };

    return (
        <>
            <Tooltip title="Xem chi tiết">
                <IconButton onClick={onView}><Visibility /></IconButton>
            </Tooltip>
            <IconButton onClick={e => setAnchorEl(e.currentTarget)}><MoreVert /></IconButton>

            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
                {!user.isAdmin && (
                    <MenuItem onClick={() => handleAction('admin')}>
                        <AdminPanelSettings fontSize="small" sx={{ mr: 1 }} /> Cấp quyền Admin
                    </MenuItem>
                )}
                {user.isAdmin && (
                    <MenuItem onClick={() => handleAction('admin')}>
                        <Block fontSize="small" sx={{ mr: 1 }} /> Thu hồi Admin
                    </MenuItem>
                )}
                {!user.isBanned && (
                    <MenuItem onClick={() => handleAction('ban')}>
                        <Block fontSize="small" sx={{ mr: 1 }} /> Ban tài khoản
                    </MenuItem>
                )}
                {user.isBanned && (
                    <MenuItem onClick={() => handleAction('unban')}>
                        <Restore fontSize="small" sx={{ mr: 1 }} /> Mở khóa
                    </MenuItem>
                )}
                {!user.isHidden && (
                    <MenuItem onClick={() => handleAction('delete')}>
                        <Delete fontSize="small" sx={{ mr: 1 }} /> Xóa vĩnh viễn
                    </MenuItem>
                )}
                {user.isHidden && (
                    <MenuItem onClick={() => handleAction('restore')}>
                        <Restore fontSize="small" sx={{ mr: 1 }} /> Khôi phục
                    </MenuItem>
                )}
            </Menu>

            {/* Ban Dialog */}
            <Dialog open={banDialog} onClose={() => setBanDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Block color="error" />
                        Ban tài khoản: {user.fullName}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={2}>
                        <TextField
                            label="Lý do ban"
                            multiline
                            rows={3}
                            fullWidth
                            required
                            value={banData.reason}
                            onChange={e => setBanData(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder="Ví dụ: Vi phạm quy định cộng đồng..."
                        />

                        <FormControl fullWidth>
                            <InputLabel>Thời hạn</InputLabel>
                            <Select
                                value={banData.duration || ''}
                                onChange={e => setBanData(prev => ({ ...prev, duration: e.target.value || null }))}
                                label="Thời hạn"
                            >
                                <MenuItem value="">Vĩnh viễn</MenuItem>
                                <MenuItem value={1}>1 ngày</MenuItem>
                                <MenuItem value={3}>3 ngày</MenuItem>
                                <MenuItem value={7}>7 ngày</MenuItem>
                                <MenuItem value={30}>30 ngày</MenuItem>
                                <MenuItem value={90}>90 ngày</MenuItem>
                                <MenuItem value={365}>1 năm</MenuItem>
                            </Select>
                        </FormControl>

                        <Box bgcolor="error.50" p={2} borderRadius={1}>
                            <Typography variant="caption" color="error.main">
                                User sẽ bị đăng xuất ngay lập tức và không thể đăng nhập
                                {banData.duration
                                    ? ` trong ${banData.duration} ngày`
                                    : ' vĩnh viễn cho đến khi được mở khóa'}
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBanDialog(false)}>Hủy</Button>
                    <Button
                        onClick={handleBanConfirm}
                        variant="contained"
                        color="error"
                        disabled={!banData.reason.trim()}
                    >
                        Xác nhận Ban
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};