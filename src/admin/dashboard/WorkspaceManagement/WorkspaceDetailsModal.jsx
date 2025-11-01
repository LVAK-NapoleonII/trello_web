import { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Grid, Chip, Box, CircularProgress, Alert, Divider
} from '@mui/material';
import { Workspaces, Person, Dashboard, History } from '@mui/icons-material';
import { adminApi } from '../../api/adminApi';

export const WorkspaceDetailsModal = ({ workspaceId, open, onClose }) => {
    const [workspace, setWorkspace] = useState(null);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open || !workspaceId) return;

        const fetchWorkspace = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await adminApi.getWorkspace(workspaceId);
                setWorkspace(res.data.workspace);
                setStats(res.data.stats);
            } catch (err) {
                setError('Không thể tải thông tin workspace');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkspace();
    }, [workspaceId, open]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <Workspaces />
                    Chi tiết Workspace
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : !workspace ? (
                    <Alert severity="warning">Không tìm thấy workspace</Alert>
                ) : (
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="h6" fontWeight="bold">
                                {workspace.name}
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Divider />
                        </Grid>

                        <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">Chủ sở hữu</Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Person fontSize="small" />
                                <Typography variant="body2">
                                    {workspace.owner?.fullName || 'Unknown'}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">Trạng thái</Typography>
                            {workspace.isDeleted ? (
                                <Chip label="Đã xóa" color="error" size="small" />
                            ) : (
                                <Chip label="Hoạt động" color="success" size="small" />
                            )}
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">Thành viên</Typography>
                            <Box display="flex" gap={1} flexWrap="wrap">
                                {workspace.members?.slice(0, 6).map((m, i) => (
                                    <Chip
                                        key={i}
                                        label={m.fullName || 'Unknown'}
                                        size="small"
                                        variant="outlined"
                                    />
                                ))}
                                {workspace.members?.length > 6 && (
                                    <Chip label={`+${workspace.members.length - 6}`} size="small" />
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
                                    <Box textAlign="center" p={2} bgcolor="info.50" borderRadius={2}>
                                        <Dashboard color="info" />
                                        <Typography variant="h5" fontWeight="bold">
                                            {stats.boards || 0}
                                        </Typography>
                                        <Typography variant="caption">Board</Typography>
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
                                {new Date(workspace.createdAt).toLocaleDateString('vi-VN')}
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