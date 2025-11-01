// src/admin/dashboard/BoardManagement/BoardDetailsModal.jsx

import { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Grid, Chip, Box, CircularProgress, Alert, Divider
} from '@mui/material';
import { Dashboard, Workspaces, Person, ListAlt, History } from '@mui/icons-material';
import { adminApi } from '../../api/adminApi';

export const BoardDetailsModal = ({ boardId, open, onClose }) => {
    const [board, setBoard] = useState(null);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open || !boardId) return;

        const fetchBoard = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await adminApi.getBoard(boardId);
                setBoard(res.data.board);
                setStats(res.data.stats);
            } catch (err) {
                setError('Không thể tải thông tin board');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchBoard();
    }, [boardId, open]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <Dashboard />
                    Chi tiết Board
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : !board ? (
                    <Alert severity="warning">Không tìm thấy board</Alert>
                ) : (
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="h6" fontWeight="bold">
                                {board.title}
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Divider />
                        </Grid>

                        <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">Workspace</Typography>
                            <Chip
                                icon={<Workspaces fontSize="small" />}
                                label={board.workspace?.name || 'Không xác định'}
                                size="small"
                                color="info"
                            />
                        </Grid>

                        <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">Chủ sở hữu</Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Person fontSize="small" />
                                <Typography variant="body2">
                                    {board.owner?.fullName || 'Unknown'}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">Thành viên</Typography>
                            <Box display="flex" gap={1} flexWrap="wrap">
                                {board.members?.slice(0, 5).map((m, i) => (
                                    <Chip
                                        key={i}
                                        label={m.user?.fullName || 'Unknown'}
                                        size="small"
                                        variant="outlined"
                                    />
                                ))}
                                {board.members?.length > 5 && (
                                    <Chip label={`+${board.members.length - 5}`} size="small" />
                                )}
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <Divider />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>Thống kê</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box textAlign="center" p={2} bgcolor="primary.50" borderRadius={2}>
                                        <ListAlt color="primary" />
                                        <Typography variant="h5" fontWeight="bold">
                                            {stats.lists || 0}
                                        </Typography>
                                        <Typography variant="caption">Danh sách</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
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

                        <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                                <strong>Tạo:</strong>{' '}
                                {new Date(board.createdAt).toLocaleDateString('vi-VN')}
                            </Typography>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} variant="contained">Đóng</Button>
            </DialogActions>
        </Dialog>
    );
};