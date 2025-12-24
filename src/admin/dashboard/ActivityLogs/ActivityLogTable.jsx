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
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Pagination,
    CircularProgress,
    Alert,
    Typography,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    History,
    Person,
    Workspaces,
    Dashboard,
    AdminPanelSettings,
    Block,
    Restore,
    Delete,
    Warning
} from '@mui/icons-material';
import { adminApi } from '../../api/adminApi';

const actionIcons = {
    admin_granted: <AdminPanelSettings color="error" />,
    admin_revoked: <AdminPanelSettings color="warning" />,
    banned: <Block color="error" />,
    unbanned: <Restore color="success" />,
    deleted: <Delete color="error" />,
    permanently_deleted: <Delete color="error" />,
    restored: <Restore color="success" />,
    auto_deleted_inactive: <Warning color="warning" />,
    workspace_created: <Workspaces color="primary" />,
    workspace_deleted_by_admin: <Delete color="error" />,
    workspace_restored_by_admin: <Restore color="success" />,
    board_created: <Dashboard color="info" />,
    board_deleted_by_admin: <Delete color="error" />,
    board_restored_by_admin: <Restore color="success" />,
};

const actionLabels = {
    admin_granted: 'Cấp quyền Admin',
    admin_revoked: 'Thu hồi Admin',
    banned: 'Khóa tài khoản',
    unbanned: 'Mở khóa',
    deleted: 'Xóa (soft)',
    permanently_deleted: 'Xóa vĩnh viễn',
    restored: 'Khôi phục',
    auto_deleted_inactive: 'Tự động xóa (không hoạt động)',
    workspace_created: 'Tạo Workspace',
    workspace_deleted_by_admin: 'Xóa Workspace',
    workspace_restored_by_admin: 'Khôi phục Workspace',
    board_created: 'Tạo Board',
    board_deleted_by_admin: 'Xóa Board',
    board_restored_by_admin: 'Khôi phục Board',
};

const categoryIcons = {
    user: <Person color="primary" />,
    workspace: <Workspaces color="info" />,
    board: <Dashboard color="warning" />
};

export const ActivityLogTable = () => {
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 50,
        type: ''
    });

    const loadLogs = async () => {
        setLoading(true);
        try {
            const params = {
                page: filters.page,
                limit: filters.limit,
                ...(filters.type && { type: filters.type })
            };
            const res = await adminApi.getActivityLogs(params);
            setLogs(res.data.activities || []);
            setPagination(res.data.pagination || {});
        } catch (err) {
            console.error('Lỗi tải logs:', err);
            alert('Không thể tải lịch sử hoạt động');
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const getActionIcon = (type) => actionIcons[type] || <History />;
    const getActionLabel = (type) => actionLabels[type] || type;

    return (
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h5" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                    <History />
                    Lịch sử hoạt động Admin
                </Typography>

                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Lọc theo loại</InputLabel>
                    <Select
                        value={filters.type}
                        onChange={e => handleFilterChange('type', e.target.value)}
                        label="Lọc theo loại"
                    >
                        <MenuItem value="">Tất cả</MenuItem>
                        <MenuItem value="admin_granted">Cấp Admin</MenuItem>
                        <MenuItem value="banned">Khóa tài khoản</MenuItem>
                        <MenuItem value="deleted">Xóa người dùng</MenuItem>
                        <MenuItem value="restored">Khôi phục</MenuItem>
                        <MenuItem value="workspace_deleted_by_admin">Xóa Không gian làm việc</MenuItem>
                        <MenuItem value="board_deleted_by_admin">Xóa Bảng làm việc</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" p={5}>
                    <CircularProgress />
                </Box>
            ) : !logs || logs.length === 0 ? (
                <Alert severity="info">Không có hoạt động nào</Alert>
            ) : (
                <>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Thời gian</strong></TableCell>
                                    <TableCell><strong>Admin</strong></TableCell>
                                    <TableCell><strong>Hành động</strong></TableCell>
                                    <TableCell><strong>Chi tiết</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log._id} hover>
                                        <TableCell>
                                            <Typography variant="body2" noWrap>
                                                {new Date(log.createdAt).toLocaleString('vi-VN')}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                {categoryIcons[log?.action?.category] || <Person />}
                                                <Box>
                                                    <Typography fontWeight="medium">
                                                        {log?.user?.fullName || 'Unknown'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {log?.user?.email || ''}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                icon={getActionIcon(log?.action?.type)}
                                                label={getActionLabel(log?.action?.type)}
                                                size="small"
                                                color={
                                                    log?.action?.type?.includes('delete') || log?.action?.type === 'banned'
                                                        ? 'error'
                                                        : log?.action?.type?.includes('restore') || log?.action?.type === 'unbanned'
                                                            ? 'success'
                                                            : 'primary'
                                                }
                                                variant="outlined"
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <Typography variant="body2">
                                                {log?.details || 'Không có mô tả'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box display="flex" justifyContent="center" mt={3}>
                        <Pagination
                            count={pagination?.pages || 1}
                            page={pagination?.page || 1}
                            onChange={(_, page) => handleFilterChange('page', page)}
                            color="primary"
                        />
                    </Box>
                </>
            )}
        </Paper>
    );
};