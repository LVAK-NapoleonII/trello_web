import { useState, useEffect } from 'react';
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Box, TextField, Chip, Pagination, CircularProgress, Alert, Typography,
    IconButton, Tooltip
} from '@mui/material';
import {
    Visibility, Delete, Restore, Dashboard as BoardIcon, Workspaces, Person
} from '@mui/icons-material';
import { adminApi } from '../../api/adminApi';
import { BoardDetailsModal } from './BoardDetailsModal';

export const BoardList = () => {
    const [boards, setBoards] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ page: 1, search: '' });
    const [selectedBoard, setSelectedBoard] = useState(null);

    const loadBoards = async () => {
        setLoading(true);
        try {
            const params = {
                page: filters.page,
                limit: 20,
                ...(filters.search && { search: filters.search })
            };
            const res = await adminApi.getBoards(params);
            setBoards(res.data.boards);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error('Lỗi tải boards:', err);
            alert('Không thể tải danh sách board');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBoards();
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handleDelete = async (boardId, permanent = false) => {
        if (!window.confirm(permanent ? 'Xóa vĩnh viễn board này?' : 'Xóa board (soft delete)?')) return;
        try {
            await adminApi.deleteBoard(boardId, permanent);
            loadBoards();
        } catch (err) {
            alert('Lỗi xóa board');
        }
    };

    const handleRestore = async (boardId) => {
        if (!window.confirm('Khôi phục board này?')) return;
        try {
            await adminApi.restoreBoard(boardId);
            loadBoards();
        } catch (err) {
            alert('Lỗi khôi phục board');
        }
    };

    return (
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h5" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                    <BoardIcon /> Quản lý Board
                </Typography>
                <TextField
                    label="Tìm kiếm theo tiêu đề"
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
            ) : boards?.length === 0 ? (
                <Alert severity="info">Không có board nào</Alert>
            ) : (
                <>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Tiêu đề</strong></TableCell>
                                    <TableCell><strong>Workspace</strong></TableCell>
                                    <TableCell><strong>Chủ sở hữu</strong></TableCell>
                                    <TableCell><strong>Thành viên</strong></TableCell>
                                    <TableCell><strong>Trạng thái</strong></TableCell>
                                    <TableCell align="right"><strong>Hành động</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {boards.map((board) => (
                                    <TableRow
                                        key={board._id}
                                        hover
                                        sx={{
                                            opacity: board.isDeleted ? 0.6 : 1,
                                            bgcolor: board.isDeleted ? 'action.disabledBackground' : 'inherit'
                                        }}
                                    >
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <BoardIcon fontSize="small" color={board.isDeleted ? 'disabled' : 'primary'} />
                                                <Typography
                                                    fontWeight="medium"
                                                    color={board.isDeleted ? 'text.disabled' : 'inherit'}
                                                >
                                                    {board.title}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={<Workspaces fontSize="small" />}
                                                label={board.workspace?.name || 'Không xác định'}
                                                size="small"
                                                color="info"
                                                variant="outlined"
                                                sx={{ opacity: board.isDeleted ? 0.7 : 1 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Person fontSize="small" color={board.isDeleted ? 'disabled' : 'inherit'} />
                                                <Typography variant="body2" color={board.isDeleted ? 'text.disabled' : 'inherit'}>
                                                    {board.owner?.fullName || 'Unknown'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`${board?.members?.length || 0} thành viên`}
                                                size="small"
                                                color="secondary"
                                                sx={{ opacity: board.isDeleted ? 0.7 : 1 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {board.isDeleted ? (
                                                <Chip label="Đã xóa" color="error" size="small" />
                                            ) : (
                                                <Chip label="Hoạt động" color="success" size="small" />
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Xem chi tiết">
                                                <IconButton
                                                    onClick={() => setSelectedBoard(board)}
                                                    disabled={board.isDeleted}
                                                >
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>

                                            {board.isDeleted ? (
                                                <Tooltip title="Khôi phục">
                                                    <IconButton onClick={() => handleRestore(board._id)} color="success">
                                                        <Restore />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : (
                                                <>
                                                    <Tooltip title="Xóa (soft)">
                                                        <IconButton onClick={() => handleDelete(board._id, false)} color="warning">
                                                            <Delete />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Xóa vĩnh viễn">
                                                        <IconButton onClick={() => handleDelete(board._id, true)} color="error">
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
                            count={pagination?.pages || 1}
                            page={pagination?.page || 1}
                            onChange={(_, page) => handleFilterChange('page', page)}
                            color="primary"
                        />
                    </Box>
                </>
            )}

            {selectedBoard && (
                <BoardDetailsModal
                    boardId={selectedBoard._id}
                    open={!!selectedBoard}
                    onClose={() => setSelectedBoard(null)}
                />
            )}
        </Paper>
    );
};