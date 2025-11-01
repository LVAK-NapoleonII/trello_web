import { IconButton, Tooltip, Menu, MenuItem } from '@mui/material';
import {
    Visibility, AdminPanelSettings, Block, Delete, Restore, MoreVert
} from '@mui/icons-material';
import { useState } from 'react';
import { adminApi } from '../../api/adminApi';

export const UserActions = ({ user, onUpdate, onView }) => {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleAction = async (action) => {
        try {
            if (action === 'admin') await adminApi.updateAdmin(user._id, !user.isAdmin);
            if (action === 'ban') {
                const reason = prompt('Lý do ban:');
                if (reason) await adminApi.banUser(user._id, reason);
            }
            if (action === 'unban') await adminApi.unbanUser(user._id);
            if (action === 'delete') {
                if (window.confirm('Xóa vĩnh viễn?')) {
                    await adminApi.deleteUser(user._id, true);
                }
            }
            if (action === 'restore') await adminApi.restoreUser(user._id);
            onUpdate();
        } catch (err) {
            alert('Lỗi thực hiện hành động');
        }
        setAnchorEl(null);
    };

    return (
        <>
            <Tooltip title="Xem chi tiết">
                <IconButton onClick={onView}><Visibility /></IconButton>
            </Tooltip>
            <IconButton onClick={e => setAnchorEl(e.currentTarget)}><MoreVert /></IconButton>
            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
                {!user.isAdmin && <MenuItem onClick={() => handleAction('admin')}>
                    <AdminPanelSettings fontSize="small" sx={{ mr: 1 }} /> Cấp quyền Admin
                </MenuItem>}
                {user.isAdmin && <MenuItem onClick={() => handleAction('admin')}>
                    <Block fontSize="small" sx={{ mr: 1 }} /> Thu hồi Admin
                </MenuItem>}
                {!user.isBanned && <MenuItem onClick={() => handleAction('ban')}>
                    <Block fontSize="small" sx={{ mr: 1 }} /> Ban tài khoản
                </MenuItem>}
                {user.isBanned && <MenuItem onClick={() => handleAction('unban')}>
                    <Restore fontSize="small" sx={{ mr: 1 }} /> Mở khóa
                </MenuItem>}
                {!user.isHidden && <MenuItem onClick={() => handleAction('delete')}>
                    <Delete fontSize="small" sx={{ mr: 1 }} /> Xóa vĩnh viễn
                </MenuItem>}
                {user.isHidden && <MenuItem onClick={() => handleAction('restore')}>
                    <Restore fontSize="small" sx={{ mr: 1 }} /> Khôi phục
                </MenuItem>}
            </Menu>
        </>
    );
};