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
    Chip,
    Pagination,
    CircularProgress,
    Alert,
    Typography,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Visibility,
    Delete,
    Restore,
    Workspaces,
    Person,
    Dashboard
} from '@mui/icons-material';
import { adminApi } from '../../api/adminApi';
import { WorkspaceDetailsModal } from './WorkspaceDetailsModal';

export const WorkspaceList = () => {
    const [workspaces, setWorkspaces] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ page: 1, search: '' });
    const [selectedWorkspace, setSelectedWorkspace] = useState(null);

    const loadWorkspaces = async () => {
        setLoading(true);
        try {
            const params = {
                page: filters.page,
                limit: 20,
                ...(filters.search && { search: filters.search })
            };
            const res = await adminApi.getWorkspaces(params);
            setWorkspaces(res.data.workspaces);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error('Lỗi tải workspaces:', err);
            alert('Không thể tải danh sách workspace');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWorkspaces();
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handleDelete = async (wsId, permanent = false) => {
        if (!window.confirm(permanent ? 'Xóa vĩnh viễn workspace này?' : 'Xóa workspace (soft delete)?')) return;
        try {
            await adminApi.deleteWorkspace(wsId, permanent);
            loadWorkspaces();
        } catch (err) {
            alert('Lỗi xóa workspace');
        }
    };

    const handleRestore = async (wsId) => {
        try {
            await adminApi.restoreWorkspace(wsId);
            loadWorkspaces();
        } catch (err) {
            alert('Lỗi khôi phục workspace');
        }
    };

    return (
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h5" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                    <Workspaces />
                    Quản lý Workspace
                </Typography>

                <TextField
                    label="Tìm kiếm theo tên"
                    size="small"
                    value={filters.search}
                    onChange={e => handleFilterChange('search', e.target.value)}
                    sx={{ minWidth: 300 }}
                />
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" p={5}>
                    <CircularProgress />
                </Box>
            ) : workspaces.length === 0 ? (
                <Alert severity="info">Không có workspace nào</Alert>
            ) : (
                <>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Tên</strong></TableCell>
                                    <TableCell><strong>Chủ sở hữu</strong></TableCell>
                                    <TableCell><strong>Thành viên</strong></TableCell>
                                    <TableCell><strong>Board</strong></TableCell>
                                    <TableCell><strong>Trạng thái</strong></TableCell>
                                    <TableCell align="right"><strong>Hành động</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {workspaces.map((ws) => (
                                    <TableRow key={ws._id} hover>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Workspaces fontSize="small" color="info" />
                                                <Typography fontWeight="medium">{ws.name}</Typography>
                                            </Box>
                                        </TableCell>

                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Person fontSize="small" />
                                                <Typography variant="body2">
                                                    {ws.owner?.fullName || 'Unknown'}
                                                </Typography>
                                            </Box>
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                label={`${ws.members?.length || 0} thành viên`}
                                                size="small"
                                                color="secondary"
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                icon={<Dashboard fontSize="small" />}
                                                label={ws.boards || 0}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </TableCell>

                                        <TableCell>
                                            {ws.isDeleted ? (
                                                <Chip label="Đã xóa" color="error" size="small" />
                                            ) : (
                                                <Chip label="Hoạt động" color="success" size="small" />
                                            )}
                                        </TableCell>

                                        <TableCell align="right">
                                            <Tooltip title="Xem chi tiết">
                                                <IconButton onClick={() => setSelectedWorkspace(ws)}>
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>

                                            {ws.isDeleted ? (
                                                <Tooltip title="Khôi phục">
                                                    <IconButton onClick={() => handleRestore(ws._id)} color="success">
                                                        <Restore />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : (
                                                <>
                                                    <Tooltip title="Xóa (soft)">
                                                        <IconButton onClick={() => handleDelete(ws._id, false)} color="warning">
                                                            <Delete />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Xóa vĩnh viễn">
                                                        <IconButton onClick={() => handleDelete(ws._id, true)} color="error">
                                                            <Delete />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box display="flex" justifyContent="center" mt={3}>
                        <Pagination
                            count={pagination.pages || 1}
                            page={pagination.page || 1}
                            onChange={(_, page) => handleFilterChange('page', page)}
                            color="primary"
                        />
                    </Box>
                </>
            )}

            {/* Modal chi tiết */}
            {selectedWorkspace && (
                <WorkspaceDetailsModal
                    workspaceId={selectedWorkspace._id}
                    open={!!selectedWorkspace}
                    onClose={() => setSelectedWorkspace(null)}
                />
            )}
        </Paper>
    );
};