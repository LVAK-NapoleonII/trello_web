import { Box, Container, Toolbar } from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import { AdminSidebar } from './Layout/AdminSidebar';
import { AdminHeader } from './Layout/AdminHeader';
import { DashboardStats } from './DashboardStats';
import { UserList } from './UserManagement/UserList';
import { WorkspaceList } from './WorkspaceManagement/WorkspaceList';
import { BoardList } from './BoardManagement/BoardList';
import { InactiveUserList } from './InactiveUsers/InactiveUserList';
import { ActivityLogTable } from './ActivityLogs/ActivityLogTable';

const drawerWidth = 240;

export const AdminDashboard = () => {
    return (
        <Box sx={{ display: 'flex' }}>
            <AdminSidebar />
            <Box sx={{ flexGrow: 1 }}>
                <AdminHeader />
                <Box component="main" sx={{ p: 3, mt: '64px' }}>
                    <Toolbar />
                    <Container maxWidth="xl">
                        <Routes>
                            <Route path="/" element={<DashboardStats />} />
                            <Route path="/users" element={<UserList />} />
                            <Route path="/workspaces" element={<WorkspaceList />} />
                            <Route path="/boards" element={<BoardList />} />
                            <Route path="/inactive" element={<InactiveUserList />} />
                            <Route path="/logs" element={<ActivityLogTable />} />
                        </Routes>
                    </Container>
                </Box>
            </Box>
        </Box>
    );
};