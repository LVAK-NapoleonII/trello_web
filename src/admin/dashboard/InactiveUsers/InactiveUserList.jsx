import { useState, useEffect } from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Box,
    Typography,
    Button,
    Chip,
    Pagination,
    CircularProgress,
    Alert,
    Tooltip,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Divider
} from '@mui/material';
import {
    Warning,
    Email,
    Delete,
    Schedule,
    Refresh
} from '@mui/icons-material';
import { adminApi } from '../../api/adminApi';

export const InactiveUserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(90);
    const [notifying, setNotifying] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const loadInactiveUsers = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getInactiveUsers(days);
            setUsers(res.data.users);
        } catch (err) {
            console.error('Lỗi tải người dùng không hoạt động:', err);
            alert('Không thể tải danh sách');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInactiveUsers();
    }, [days]);

    const handleSendNotices = async () => {
        if (!window.confirm(`Gửi thông báo cho ${users.filter(u => !u.inactiveNoticeSent).length} người dùng không hoạt động?`)) return;
        setNotifying(true);
        try {
            const res = await adminApi.sendInactivityNotices();
            alert(res.data.message);
            loadInactiveUsers();
        } catch (err) {
            alert('Lỗi gửi thông báo');
        } finally {
            setNotifying(false);
        }
    };

    const handleDeleteInactive = async () => {
        if (!window.confirm('Xóa tất cả người dùng đã được thông báo và hết hạn?')) return;
        setDeleting(true);
        try {
            const res = await adminApi.deleteInactiveUsers();
            alert(res.data.message);
            loadInactiveUsers();
        } catch (err) {
            alert('Lỗi xóa người dùng');
        } finally {
            setDeleting(false);
        }
    };

    const getStatusChip = (user) => {
        if (user.inactiveNoticeSent) {
            return <Chip label="Đã gửi TB" color="warning" size="small" />;
        }
        if (user.scheduledDeletion) {
            return <Chip label="Sắp xóa" color="error" size="small" />;
        }
        return <Chip label="Chưa gửi TB" color="default" size="small" />;
    };

    return (
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h5" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                    <Warning color="error" />
                    Người dùng không hoạt động
                </Typography>

                <Box display="flex" gap={2} alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Ngày</InputLabel>
                        <Select value={days} onChange={e => setDays(e.target.value)} label="Ngày">
                            <MenuItem value={30}>30 ngày</MenuItem>
                            <MenuItem value={60}>60 ngày</MenuItem>
                            <MenuItem value={90}>90 ngày</MenuItem>
                            <MenuItem value={180}>180 ngày</MenuItem>
                        </Select>
                    </FormControl>

                    <Tooltip title="Tải lại danh sách">
                        <IconButton onClick={loadInactiveUsers} color="primary">
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Box display="flex" gap={2} mb={3}>
                <Button
                    variant="outlined"
                    startIcon={<Email />}
                    onClick={handleSendNotices}
                    disabled={notifying || users.filter(u => !u.inactiveNoticeSent).length === 0}
                >
                    {notifying ? 'Đang gửi...' : 'Gửi thông báo (7 ngày)'}
                </Button>

                <Button
                    variant="contained"
                    color="error"
                    startIcon={<Delete />}
                    onClick={handleDeleteInactive}
                    disabled={deleting || users.filter(u => u.scheduledDeletion && new Date(u.scheduledDeletion) <= new Date()).length === 0}
                >
                    {deleting ? 'Đang xóa...' : 'Xóa hết hạn'}
                </Button>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {loading ? (
                <Box display="flex" justifyContent="center" p={5}>
                    <CircularProgress />
                </Box>
            ) : !users || users.length === 0 ? (
                <Alert severity="success">Không có người dùng không hoạt động trong {days} ngày</Alert>
            ) : (
                <>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Tên</strong></TableCell>
                                    <TableCell><strong>Email</strong></TableCell>
                                    <TableCell><strong>Lần cuối hoạt động</strong></TableCell>
                                    <TableCell><strong>Trạng thái</strong></TableCell>
                                    <TableCell><strong>Ngày xóa dự kiến</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user._id} hover>
                                        <TableCell>
                                            <Typography fontWeight="medium">{user.fullName}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {user.email}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Schedule fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    {new Date(user.lastActive).toLocaleDateString('vi-VN')}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{getStatusChip(user)}</TableCell>
                                        <TableCell>
                                            {user.scheduledDeletion ? (
                                                <Chip
                                                    label={new Date(user.scheduledDeletion).toLocaleDateString('vi-VN')}
                                                    size="small"
                                                    color="error"
                                                    variant="outlined"
                                                />
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    Chưa đặt
                                                </Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box display="flex" justifyContent="center" mt={3}>
                        <Pagination
                            count={Math.ceil(users?.length / 20)}
                            page={1}
                            color="primary"
                            disabled
                        />
                    </Box>
                </>
            )}
        </Paper>
    );
};