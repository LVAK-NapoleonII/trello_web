import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment,
  Card,
  CardContent,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  Image as ImageIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import axios from "axios";
import { toast } from "react-toastify";
import { SocketContext } from "../../context/SocketContext";

const WorkspaceSettingsPage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const { socket, socketReady } = useContext(SocketContext);

  const [workspace, setWorkspace] = useState(null);
  const [originalWorkspace, setOriginalWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [backgroundPreview, setBackgroundPreview] = useState("");
  const [backgroundError, setBackgroundError] = useState(false);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Vui lòng đăng nhập!");

        const response = await axios.get(`http://localhost:5000/api/workspaces/${workspaceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setWorkspace(response.data);
        setOriginalWorkspace(response.data);
        setBackgroundPreview(response.data.background || "");
      } catch (err) {
        setError(err.response?.data?.message || "Không thể tải thông tin workspace!");
        toast.error("Không thể tải thông tin workspace!");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [workspaceId]);

  // Check for changes
  useEffect(() => {
    if (workspace && originalWorkspace) {
      const changed = JSON.stringify(workspace) !== JSON.stringify(originalWorkspace);
      setHasChanges(changed);
    }
  }, [workspace, originalWorkspace]);

  const handleInputChange = (field, value) => {
    setWorkspace(prev => ({ ...prev, [field]: value }));
    if (field === 'background') {
      setBackgroundPreview(value);
      setBackgroundError(false);
    }
  };

  const handleBackgroundError = () => {
    setBackgroundError(true);
  };

  const handleUpdate = async () => {
    try {
      setUpdateLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập!");

      const response = await axios.put(`http://localhost:5000/api/workspaces/${workspaceId}`, workspace, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Emit socket event for real-time updates
      if (socket && socketReady) {
        socket.emit("workspace-updated", {
          workspace: response.data,
        });
      }

      setOriginalWorkspace(response.data);
      setWorkspace(response.data);
      setHasChanges(false);
      toast.success("Cập nhật workspace thành công!");
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi cập nhật workspace!");
      toast.error("Lỗi khi cập nhật workspace!");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleReset = () => {
    setWorkspace({ ...originalWorkspace });
    setBackgroundPreview(originalWorkspace.background || "");
    setBackgroundError(false);
    setHasChanges(false);
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh'
      }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error && !workspace) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      </Box>
    );
  }

  if (!workspace) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Không tìm thấy workspace!
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: isDarkMode ? '#0F1419' : '#F8FAFC',
        p: { xs: 2, md: 3 },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Tooltip title="Quay lại">
            <IconButton
              onClick={() => navigate(-1)}
              sx={{
                bgcolor: isDarkMode ? alpha('#fff', 0.05) : alpha('#000', 0.04),
                '&:hover': { bgcolor: isDarkMode ? alpha('#fff', 0.1) : alpha('#000', 0.08) }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: isDarkMode ? '#6366F1' : '#4F46E5',
                width: 48,
                height: 48,
              }}
            >
              <SettingsIcon />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="700" color="text.primary">
                Cài đặt Workspace
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Tùy chỉnh thông tin và cài đặt của workspace
              </Typography>
            </Box>
          </Box>
        </Box>

        {hasChanges && (
          <Alert
            severity="info"
            sx={{
              borderRadius: 2,
              bgcolor: alpha(theme.palette.info.main, 0.1),
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            }}
            action={
              <Button
                color="info"
                size="small"
                onClick={handleReset}
                sx={{ textTransform: 'none' }}
              >
                Hoàn tác
              </Button>
            }
          >
            Bạn có thay đổi chưa được lưu
          </Alert>
        )}
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Settings Form */}
        <Box sx={{ flex: 1 }}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: isDarkMode
                ? '0 8px 32px rgba(0,0,0,0.3)'
                : '0 8px 32px rgba(0,0,0,0.06)',
              border: `1px solid ${isDarkMode ? alpha('#fff', 0.08) : alpha('#000', 0.06)}`,
              bgcolor: isDarkMode ? '#1A1D29' : '#FFFFFF',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <EditIcon fontSize="small" />
                Thông tin cơ bản
              </Typography>

              {/* Workspace Name */}
              <TextField
                label="Tên workspace"
                value={workspace.name || ""}
                onChange={(e) => handleInputChange('name', e.target.value)}
                fullWidth
                variant="outlined"
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: isDarkMode
                        ? '0 0 0 1px rgba(99, 102, 241, 0.3)'
                        : '0 0 0 1px rgba(79, 70, 229, 0.2)',
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EditIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Description */}
              <TextField
                label="Mô tả"
                value={workspace.description || ""}
                onChange={(e) => handleInputChange('description', e.target.value)}
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                placeholder="Thêm mô tả cho workspace của bạn..."
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                  }
                }}
              />

              {/* Background URL */}
              <TextField
                label="URL hình nền"
                value={workspace.background || ""}
                onChange={(e) => handleInputChange('background', e.target.value)}
                fullWidth
                variant="outlined"
                placeholder="https://example.com/image.jpg"
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ImageIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <Divider sx={{ my: 3 }} />

              {/* Privacy Settings */}
              <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
                Cài đặt quyền riêng tư
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={workspace.isPublic || false}
                    onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {workspace.isPublic ? <PublicIcon fontSize="small" /> : <PrivateIcon fontSize="small" />}
                    <Box>
                      <Typography variant="body2" fontWeight="500">
                        {workspace.isPublic ? 'Workspace công khai' : 'Workspace riêng tư'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {workspace.isPublic
                          ? 'Mọi người có thể tìm thấy và tham gia workspace này'
                          : 'Chỉ những người được mời mới có thể truy cập'
                        }
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{
                  alignItems: 'flex-start',
                  '& .MuiFormControlLabel-label': { mt: 0.5 }
                }}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={!hasChanges || updateLoading}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
              }}
            >
              Hoàn tác
            </Button>
            <Button
              variant="contained"
              onClick={handleUpdate}
              disabled={!hasChanges || updateLoading}
              startIcon={
                updateLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <SaveIcon />
                )
              }
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                bgcolor: '#6366F1',
                '&:hover': { bgcolor: '#5B5BF7' },
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              }}
            >
              {updateLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </Box>
        </Box>

        {/* Preview Panel */}
        <Box sx={{ width: { lg: 400 }, flexShrink: 0 }}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: isDarkMode
                ? '0 8px 32px rgba(0,0,0,0.3)'
                : '0 8px 32px rgba(0,0,0,0.06)',
              border: `1px solid ${isDarkMode ? alpha('#fff', 0.08) : alpha('#000', 0.06)}`,
              bgcolor: isDarkMode ? '#1A1D29' : '#FFFFFF',
              position: 'sticky',
              top: 24,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
                Xem trước
              </Typography>

              {/* Workspace Preview */}
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: `1px solid ${isDarkMode ? alpha('#fff', 0.1) : alpha('#000', 0.1)}`,
                  position: 'relative',
                  height: 160,
                  bgcolor: backgroundPreview && !backgroundError
                    ? 'transparent'
                    : (isDarkMode ? '#2D3748' : '#F7FAFC'),
                  backgroundImage: backgroundPreview && !backgroundError
                    ? `url(${backgroundPreview})`
                    : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                {backgroundPreview && !backgroundError && (
                  <img
                    src={backgroundPreview}
                    alt="Background preview"
                    style={{ display: 'none' }}
                    onError={handleBackgroundError}
                  />
                )}

                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    textAlign: 'center',
                    p: 2,
                  }}
                >
                  <Typography variant="h6" fontWeight="700" sx={{ mb: 1 }}>
                    {workspace.name || 'Tên workspace'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                    {workspace.description || 'Chưa có mô tả'}
                  </Typography>
                  <Chip
                    icon={workspace.isPublic ? <PublicIcon /> : <PrivateIcon />}
                    label={workspace.isPublic ? 'Công khai' : 'Riêng tư'}
                    size="small"
                    sx={{
                      bgcolor: workspace.isPublic
                        ? alpha('#10B981', 0.9)
                        : alpha('#6B7280', 0.9),
                      color: 'white',
                      fontWeight: 500,
                    }}
                  />
                </Box>
              </Box>

              {backgroundError && backgroundPreview && (
                <Alert
                  severity="warning"
                  size="small"
                  sx={{ mt: 2, borderRadius: 1 }}
                  icon={<WarningIcon fontSize="inherit" />}
                >
                  Không thể tải hình nền
                </Alert>
              )}

              {/* Status */}
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {hasChanges ? (
                    <>
                      <Box sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: '#F59E0B',
                        animation: 'pulse 1.5s ease-in-out infinite'
                      }} />
                      <Typography variant="caption" color="warning.main" fontWeight="500">
                        Có thay đổi chưa lưu
                      </Typography>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon fontSize="small" color="success" />
                      <Typography variant="caption" color="success.main" fontWeight="500">
                        Đã đồng bộ
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default WorkspaceSettingsPage; 