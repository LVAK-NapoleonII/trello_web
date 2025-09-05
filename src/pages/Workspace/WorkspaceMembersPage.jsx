import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Chip,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Badge,
  Tooltip,
  IconButton,
  useTheme,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Dashboard as DashboardIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import axios from "axios";
import { toast } from "react-toastify";

const WorkspaceMembersPage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [allBoardMembers, setAllBoardMembers] = useState([]);
  const [boardMembers, setBoardMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchWorkspaceMembers = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Vui lòng đăng nhập!");

        const response = await axios.get(
          `http://localhost:5000/api/boards/workspace/${workspaceId}/members`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const { workspaceMembers, allBoardMembers, boardMembers } = response.data;

        // Log dữ liệu để kiểm tra trùng lặp
        console.log("[WorkspaceMembersPage] Raw boardMembers data:", boardMembers);

        // Lọc trùng lặp trong board.members dựa trên _id
        const deduplicatedBoardMembers = boardMembers.map((board) => ({
          ...board,
          members: Array.from(
            new Map(board.members.map((member) => [member._id, member])).values()
          ),
        }));

        console.log("[WorkspaceMembersPage] Deduplicated boardMembers:", deduplicatedBoardMembers);

        setWorkspaceMembers(workspaceMembers || []);
        setAllBoardMembers(allBoardMembers || []);
        setBoardMembers(deduplicatedBoardMembers || []);
      } catch (err) {
        const errorMessage = err.response?.data?.message || "Không thể tải danh sách thành viên!";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Fetch members error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      fetchWorkspaceMembers();
    }
  }, [workspaceId]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "owner":
        return "error";
      case "member":
        return "primary";
      case "workspace_member":
        return "secondary";
      default:
        return "default";
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "owner":
        return "Chủ bảng";
      case "member":
        return "Thành viên";
      case "workspace_member":
        return "Thành viên workspace";
      default:
        return "Không xác định";
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme.palette.mode === "dark" ? "#0F1419" : "#F8FAFC",
        p: { xs: 2, md: 3 },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Tooltip title="Quay lại">
            <IconButton
              onClick={() => {
                console.log("[WorkspaceMembersPage] Navigating back");
                navigate(-1);
              }}
              sx={{
                bgcolor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
                "&:hover": {
                  bgcolor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
                },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: theme.palette.mode === "dark" ? "#6366F1" : "#4F46E5",
                width: 48,
                height: 48,
              }}
            >
              <GroupIcon />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="700" color="text.primary">
                Thành viên Workspace
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Quản lý thành viên và vai trò trong workspace
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab
          label={`Tất cả thành viên (${allBoardMembers.length})`}
          icon={<PersonIcon />}
        />
        <Tab
          label={`Thành viên workspace (${workspaceMembers.length})`}
          icon={<GroupIcon />}
        />
        <Tab
          label={`Theo bảng (${boardMembers.length})`}
          icon={<DashboardIcon />}
        />
      </Tabs>

      {/* Tab 1: Tất cả thành viên */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tổng quan thành viên
            </Typography>
            {allBoardMembers.length > 0 ? (
              <List>
                {allBoardMembers.map((member) => (
                  <ListItem key={member._id} divider>
                    <ListItemAvatar>
                      <Badge
                        color={member.isOnline ? "success" : "default"}
                        variant="dot"
                        overlap="circular"
                      >
                        <Avatar src={member.avatar} alt={member.fullName}>
                          {member.fullName?.charAt(0).toUpperCase()}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1">
                            {member.fullName}
                          </Typography>
                          <Chip
                            label={getRoleLabel(member.role)}
                            color={getRoleColor(member.role)}
                            size="small"
                          />
                          {member.isOnline && (
                            <Chip label="Online" color="success" size="small" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {member.email}
                          </Typography>
                          {member.boards && member.boards.length > 0 && (
                            <Typography variant="caption" color="textSecondary">
                              Tham gia {member.boards.length} bảng: {member.boards.join(", ")}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="textSecondary">
                Không có thành viên nào trong workspace này.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Thành viên workspace */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Thành viên workspace
            </Typography>
            {workspaceMembers.length > 0 ? (
              <List>
                {workspaceMembers.map((member) => (
                  <ListItem key={member._id} divider>
                    <ListItemAvatar>
                      <Badge
                        color={member.isOnline ? "success" : "default"}
                        variant="dot"
                        overlap="circular"
                      >
                        <Avatar src={member.avatar} alt={member.fullName}>
                          {member.fullName?.charAt(0).toUpperCase()}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1">
                            {member.fullName}
                          </Typography>
                          {member.isOnline && (
                            <Chip label="Online" color="success" size="small" />
                          )}
                        </Box>
                      }
                      secondary={member.email}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="textSecondary">
                Không có thành viên workspace nào.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Thành viên theo bảng */}
      {tabValue === 2 && (
        <Box>
          {boardMembers.length > 0 ? (
            boardMembers.map((board) => (
              <Accordion key={board.boardId} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <DashboardIcon />
                    <Typography variant="h6">{board.boardTitle}</Typography>
                    <Chip
                      label={`${board.members.length} thành viên`}
                      size="small"
                      color="primary"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {board.members.map((member) => (
                      <Grid item xs={12} sm={6} md={4} key={member._id}>
                        <Card variant="outlined">
                          <CardContent sx={{ p: 2 }}>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Badge
                                color={member.isOnline ? "success" : "default"}
                                variant="dot"
                                overlap="circular"
                              >
                                <Avatar
                                  src={member.avatar}
                                  alt={member.fullName}
                                  sx={{ width: 40, height: 40 }}
                                >
                                  {member.fullName?.charAt(0).toUpperCase()}
                                </Avatar>
                              </Badge>
                              <Box flex={1}>
                                <Typography variant="subtitle2" noWrap>
                                  {member.fullName}
                                </Typography>
                                <Typography variant="caption" color="textSecondary" noWrap>
                                  {member.email}
                                </Typography>
                                <Box mt={1}>
                                  <Chip
                                    label={getRoleLabel(member.role)}
                                    color={getRoleColor(member.role)}
                                    size="small"
                                  />
                                  {member.isOnline && (
                                    <Chip
                                      label="Online"
                                      color="success"
                                      size="small"
                                      sx={{ ml: 1 }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Card>
              <CardContent>
                <Typography color="textSecondary" textAlign="center">
                  Không có bảng nào trong workspace này.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
};

export default WorkspaceMembersPage;