
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { People, Workspaces, Dashboard, TrendingUp, Warning } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { adminApi } from '../api/adminApi';

const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%', bgcolor: `${color}.50` }}>
        <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                    <Typography color="textSecondary" gutterBottom>{title}</Typography>
                    <Typography variant="h4" fontWeight="bold">{value}</Typography>
                </Box>
                <Box sx={{ color: `${color}.main`, fontSize: 40 }}>{icon}</Box>
            </Box>
        </CardContent>
    </Card>
);

export const DashboardStats = () => {
    const [stats, setStats] = useState({});

    useEffect(() => {
        adminApi.getStats().then(res => setStats(res.data));
    }, []);

    const statItems = [
        { title: 'Tổng người dùng', value: stats.totalUsers, icon: <People />, color: 'primary' },
        { title: 'Đang hoạt động', value: stats.activeUsers, icon: <TrendingUp />, color: 'success' },
        { title: 'Workspace', value: stats.totalWorkspaces, icon: <Workspaces />, color: 'info' },
        { title: 'Board', value: stats.totalBoards, icon: <Dashboard />, color: 'warning' },
        { title: 'Không hoạt động (90 ngày)', value: stats.inactiveUsers, icon: <Warning />, color: 'error' },
    ];

    return (
        <Grid container spacing={3}>
            {statItems.map((item, i) => (
                <Grid item xs={12} sm={6} md={4} lg={2.4} key={i}>
                    <StatCard {...item} />
                </Grid>
            ))}
        </Grid>
    );
};