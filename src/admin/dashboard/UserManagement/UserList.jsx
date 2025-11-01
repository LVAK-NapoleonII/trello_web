import { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableRow, Paper,
    TextField, Select, MenuItem, FormControl, InputLabel,
    Button, Chip, Pagination, Box, CircularProgress, Alert, Typography
} from '@mui/material';
import { adminApi } from '../../api/adminApi';
import { UserActions } from './UserActions';
import { UserDetailsModal } from './UserDetailsModal';

export const UserList = () => {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ page: 1, search: '', status: 'all' });
    const [selectedUser, setSelectedUser] = useState(null);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getUsers(filters);
            setUsers(res.data.users || []);
            setPagination(res.data.pagination || {});
        } catch (err) {
            console.error('Lỗi tải users:', err);
            alert('Lỗi tải người dùng');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadUsers(); }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" fontWeight="bold" mb={2}>
                Quản lý người dùng
            </Typography>

            <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                <TextField
                    label="Tìm kiếm"
                    size="small"
                    value={filters.search}
                    onChange={e => handleFilterChange('search', e.target.value)}
                    sx={{ minWidth: 200 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} label="Trạng thái">
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value="online">Online</MenuItem>
                        <MenuItem value="inactive">Không hoạt động</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
            ) : !users || users.length === 0 ? (
                <Alert severity="info">Không có người dùng nào</Alert>
            ) : (
                <>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Tên</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Trạng thái</TableCell>
                                <TableCell>Quyền</TableCell>
                                <TableCell align="right">Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map(user => (
                                <TableRow key={user._id} hover>
                                    <TableCell>{user.fullName || 'N/A'}</TableCell>
                                    <TableCell>{user.email || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.isOnline ? 'Online' : 'Offline'}
                                            color={user.isOnline ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {user.isAdmin ? (
                                            <Chip label="Admin" color="error" size="small" />
                                        ) : user.isBanned ? (
                                            <Chip label="Banned" color="error" size="small" />
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell align="right">
                                        <UserActions user={user} onUpdate={loadUsers} onView={() => setSelectedUser(user)} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Box display="flex" justifyContent="center" mt={2}>
                        <Pagination
                            count={pagination?.pages || 0}
                            page={pagination?.page || 1}
                            onChange={(_, p) => handleFilterChange('page', p)}
                        />
                    </Box>
                </>
            )}

            {selectedUser && (
                <UserDetailsModal
                    userId={selectedUser._id}
                    open={!!selectedUser}
                    onClose={() => setSelectedUser(null)}
                />
            )}
        </Paper>
    );
};