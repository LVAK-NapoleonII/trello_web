import { AppBar, Toolbar, Typography, IconButton, Avatar, Box } from '@mui/material';
import { Logout } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 240;

export const AdminHeader = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <AppBar
            position="fixed"
            sx={{
                width: `calc(100% - ${drawerWidth}px)`,
                ml: `${drawerWidth}px`,
                bgcolor: 'background.paper',
                color: 'text.primary',
                boxShadow: 1
            }}
        >
            <Toolbar>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    Quản trị hệ thống
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar alt="Admin" src="/avatar.jpg" />
                    <IconButton onClick={handleLogout} color="inherit">
                        <Logout />
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
};