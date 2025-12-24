import {
    Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Box
} from '@mui/material';
import {
    Dashboard, People, Workspaces, Dashboard as BoardIcon,
    History, Warning, AdminPanelSettings
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const menuItems = [
    { text: 'Tổng quan', icon: <Dashboard />, path: '/admin' },
    { text: 'Người dùng', icon: <People />, path: '/admin/users' },
    { text: 'Không gian làm việc', icon: <Workspaces />, path: '/admin/workspaces' },
    { text: 'Bảng làm việc', icon: <BoardIcon />, path: '/admin/boards' },
    { text: 'Không hoạt động', icon: <Warning />, path: '/admin/inactive' },
    { text: 'Lịch sử', icon: <History />, path: '/admin/logs' },
];

export const AdminSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    bgcolor: 'primary.main',
                    color: 'white'
                },
            }}
        >
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AdminPanelSettings />
                <Box fontWeight="bold">Quản lý của Admin</Box>
            </Box>
            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
            <List>
                {menuItems.map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        selected={location.pathname === item.path}
                        onClick={() => navigate(item.path)}
                        sx={{
                            '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)' },
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                        }}
                    >
                        <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
        </Drawer>
    );
};