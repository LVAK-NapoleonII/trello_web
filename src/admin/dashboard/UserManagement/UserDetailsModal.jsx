import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Grid,
    Chip,
    Box,
    CircularProgress,
    Alert,
    Divider
} from '@mui/material';
import {
    Email,
    Person,
    AdminPanelSettings,
    Block,
    Schedule,
    Workspaces,
    Dashboard,
    History,
    Warning
} from '@mui/icons-material';
import { adminApi } from '../../api/adminApi';

export const UserDetailsModal = ({ userId, open, onClose }) => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open || !userId) {
            setUser(null);
            setStats({});
            return;
        }

        const fetchUser = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await adminApi.getUser(userId);
                setUser(res.data.user);
                setStats(res.data.stats);
            } catch (err) {
                setError('Không thể tải thông tin người dùng');
                console.error('Lỗi tải user:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [userId, open]);

    if (!open) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <Person />
                    Chi tiết người dùng
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : !user ? (
                    <Alert severity="warning">Không tìm thấy người dùng</Alert>
                ) : (
                    <Grid container spacing={2}>
                        {/* Thông tin cơ bản */}
                        <Grid item xs={12}>
                            <Typography variant="h6" fontWeight="bold">
                                {user.fullName}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                                <Email fontSize="small" />
                                <Typography variant="body2">{user.email}</Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <Divider />
                        </Grid>

                        {/* Trạng thái & Quyền */}
                        <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Trạng thái
                            </Typography>
                            <Chip
                                label={user.isOnline ? 'Online' : 'Offline'}
                                color={user.isOnline ? 'success' : 'default'}
                                size="small"
                                icon={<Schedule />}
                            />
                        </Grid>

                        <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Quyền hạn
                            </Typography>
                            {user.isAdmin ? (
                                <Chip label="Admin" color="error" size="small" icon={<AdminPanelSettings />} />
                            ) : user.isBanned ? (
                                <Chip label="Bị khóa" color="warning" size="small" icon={<Block />} />
                            ) : (
                                <Chip label="Người dùng" color="primary" size="small" />
                            )}
                        </Grid>

                        {/* Thông tin BAN (nếu bị khóa) */}
                        {user.isBanned && (
                            <>
                                <Grid item xs={12}>
                                    <Divider />
                                </Grid>

                                <Grid item xs={12}>
                                    <Alert severity="error" icon={<Block />}>
                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                            Tài khoản bị khóa
                                        </Typography>
                                        <Grid container spacing={1}>
                                            <Grid item xs={12}>
                                                <Typography variant="body2">
                                                    <strong>Lý do:</strong> {user.banReason || 'Không rõ'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Typography variant="body2">
                                                    <strong>Thời gian khóa:</strong>{' '}
                                                    {user.bannedAt
                                                        ? new Date(user.bannedAt).toLocaleString('vi-VN')
                                                        : 'Không rõ'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Typography variant="body2">
                                                    <strong>Hết hạn:</strong>{' '}
                                                    {user.banExpiresAt ? (
                                                        <Chip
                                                            label={new Date(user.banExpiresAt).toLocaleString('vi-VN')}
                                                            size="small"
                                                            color="warning"
                                                            icon={<Schedule />}
                                                        />
                                                    ) : (
                                                        <Chip
                                                            label="Vĩnh viễn"
                                                            size="small"
                                                            color="error"
                                                            icon={<Warning />}
                                                        />
                                                    )}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Alert>
                                </Grid>
                            </>
                        )}

                        <Grid item xs={12}>
                            <Divider />
                        </Grid>

                        {/* Thống kê */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                                Thống kê hoạt động
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={4}>
                                    <Box textAlign="center" p={2} bgcolor="primary.50" borderRadius={2}>
                                        <Workspaces color="primary" />
                                        <Typography variant="h5" fontWeight="bold">
                                            {stats.workspaces || 0}
                                        </Typography>
                                        <Typography variant="caption">Không gian làm việc</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={4}>
                                    <Box textAlign="center" p={2} bgcolor="info.50" borderRadius={2}>
                                        <Dashboard color="info" />
                                        <Typography variant="h5" fontWeight="bold">
                                            {stats.boards || 0}
                                        </Typography>
                                        <Typography variant="caption">Bảng làm việc</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={4}>
                                    <Box textAlign="center" p={2} bgcolor="warning.50" borderRadius={2}>
                                        <History color="warning" />
                                        <Typography variant="h5" fontWeight="bold">
                                            {stats.activities || 0}
                                        </Typography>
                                        <Typography variant="caption">Hoạt động</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid item xs={12}>
                            <Divider />
                        </Grid>

                        {/* Thời gian */}
                        <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                                <strong>Tham gia:</strong>{' '}
                                {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                                <strong>Hoạt động gần nhất:</strong>{' '}
                                {user.lastActive
                                    ? new Date(user.lastActive).toLocaleString('vi-VN')
                                    : 'Chưa từng hoạt động'}
                            </Typography>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} variant="contained" color="primary">
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};