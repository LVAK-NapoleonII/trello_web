import { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, Alert, Chip, Button } from '@mui/material';
import { People, Workspaces, Dashboard, TrendingUp, Warning, Schedule } from '@mui/icons-material';
import { adminApi } from '../api/adminApi';

export const DashboardStats = () => {
    const [stats, setStats] = useState({});
    const [bans, setBans] = useState({ expiredBans: [], expiringBans: [] });

    useEffect(() => {
        adminApi.getStats().then(res => setStats(res.data));
        adminApi.getExpiringBans().then(res => setBans(res.data));
    }, []);

    const statItems = [
        { title: 'Tổng người dùng', value: stats.totalUsers, icon: <People />, color: 'primary' },
        { title: 'Đang hoạt động', value: stats.activeUsers, icon: <TrendingUp />, color: 'success' },
        { title: 'Không gian làm việc', value: stats.totalWorkspaces, icon: <Workspaces />, color: 'info' },
        { title: 'Bảng làm việc', value: stats.totalBoards, icon: <Dashboard />, color: 'warning' },
        { title: 'Không hoạt động (90 ngày)', value: stats.inactiveUsers, icon: <Warning />, color: 'error' },
    ];

    const handleUnbanExpired = async (userId) => {
        try {
            await adminApi.unbanUser(userId);
            // Reload data
            const res = await adminApi.getExpiringBans();
            setBans(res.data);
            alert('Đã unban thành công!');
        } catch (err) {
            alert('Lỗi unban user');
        }
    };

    return (
        <>
            <Grid container spacing={3}>
                {statItems.map((item, i) => (
                    <Grid item xs={12} sm={6} md={4} lg={2.4} key={i}>
                        <Card sx={{ height: '100%', bgcolor: `${item.color}.50` }}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>{item.title}</Typography>
                                        <Typography variant="h4" fontWeight="bold">{item.value}</Typography>
                                    </Box>
                                    <Box sx={{ color: `${item.color}.main`, fontSize: 40 }}>{item.icon}</Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Alert cho ban đã hết hạn */}
            {bans.expiredBans?.length > 0 && (
                <Alert severity="error" icon={<Schedule />} sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        ⚠️ {bans.expiredBans.length} tài khoản đã hết hạn ban cần xử lý
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1} mt={1}>
                        {bans.expiredBans.slice(0, 3).map((user) => (
                            <Box key={user._id} display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2">
                                        <strong>{user.fullName}</strong> ({user.email})
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Hết hạn: {new Date(user.banExpiresAt).toLocaleString('vi-VN')}
                                    </Typography>
                                </Box>
                                <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    onClick={() => handleUnbanExpired(user._id)}
                                >
                                    Unban ngay
                                </Button>
                            </Box>
                        ))}
                        {bans.expiredBans.length > 3 && (
                            <Typography variant="caption" color="text.secondary">
                                ...và {bans.expiredBans.length - 3} tài khoản khác
                            </Typography>
                        )}
                    </Box>
                </Alert>
            )}

            {/* Alert cho ban sắp hết hạn */}
            {bans.expiringBans?.length > 0 && (
                <Alert severity="warning" icon={<Schedule />} sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        {bans.expiringBans.length} tài khoản sắp hết hạn ban
                    </Typography>
                    <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                        {bans.expiringBans.slice(0, 5).map((user) => (
                            <Chip
                                key={user._id}
                                label={`${user.fullName} - ${new Date(user.banExpiresAt).toLocaleDateString('vi-VN')}`}
                                size="small"
                                color="warning"
                                variant="outlined"
                            />
                        ))}
                    </Box>
                </Alert>
            )}
        </>
    );
};