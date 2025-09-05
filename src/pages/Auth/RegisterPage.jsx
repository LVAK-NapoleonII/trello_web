import { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

const RegisterPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.removeItem("token");
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.name || !formData.email || !formData.password) {
      setError("Vui lòng điền đầy đủ thông tin!");
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu không khớp!");
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự!");
      setLoading(false);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Email không hợp lệ!");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          fullName: formData.name,
          email: formData.email,
          password: formData.password,
        }
      );
      navigate("/verify-otp", { state: { email: formData.email } });
    } catch (err) {
      setError(
        err.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, #1e3a8a, #3b0764)"
            : "linear-gradient(135deg, #6a11cb, #2575fc)",
        p: 3,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          sx={{
            width: { xs: "90%", sm: 400 },
            p: 4,
            borderRadius: 12,
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(30, 30, 30, 0.9)"
                : "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "scale(1.02)",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)",
            },
          }}
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            mb={3}
            color="primary"
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Đăng Ký
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2, borderRadius: 8 }}
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Họ và Tên"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              disabled={loading}
              sx={{
                mb: 2,
                bgcolor: (theme) => theme.palette.background.paper,
                borderRadius: 8,
              }}
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              disabled={loading}
              sx={{
                mb: 2,
                bgcolor: (theme) => theme.palette.background.paper,
                borderRadius: 8,
              }}
            />
            <TextField
              fullWidth
              label="Mật khẩu"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleTogglePassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                bgcolor: (theme) => theme.palette.background.paper,
                borderRadius: 8,
              }}
            />
            <TextField
              fullWidth
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleToggleConfirmPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                bgcolor: (theme) => theme.palette.background.paper,
                borderRadius: 8,
              }}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.2,
                borderRadius: 8,
                background: "linear-gradient(45deg, #6a11cb, #2575fc)",
                "&:hover": {
                  background: "linear-gradient(45deg, #5b0ec9, #1f66e5)",
                },
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}
              component={motion.button}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Đăng Ký"
              )}
            </Button>
          </form>

          <Typography
            textAlign="center"
            mt={3}
            variant="body2"
            color="text.secondary"
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            Đã có tài khoản?{" "}
            <Button
              onClick={() => navigate("/login")}
              sx={{
                textTransform: "none",
                color: "primary.main",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Đăng Nhập
            </Button>
          </Typography>
        </Box>
      </motion.div>
    </Box>
  );
};

export default RegisterPage;
