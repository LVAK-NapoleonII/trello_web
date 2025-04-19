import { useState } from "react";
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

const RegisterPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDarkMode = theme.palette.mode === "dark";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for confirm password visibility
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        background: isDarkMode
          ? "linear-gradient(135deg, #1c1c1c, #343434)"
          : "linear-gradient(135deg, #6a11cb, #2575fc)",
        p: 3,
      }}
    >
      <Box
        sx={{
          width: "400px",
          p: 4,
          borderRadius: 3,
          background: isDarkMode ? "#1e1e1e" : "#fff",
          boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.2)",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "scale(1.02)",
            boxShadow: "0px 12px 32px rgba(0, 0, 0, 0.3)",
          },
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          mb={2}
          textAlign="center"
          color="primary"
        >
          Đăng Ký
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
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
            InputProps={{
              sx: {
                borderRadius: 2,
                "&:hover fieldset": { borderColor: "#6a11cb" },
                "&.Mui-focused fieldset": { borderColor: "#2575fc" },
              },
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
            InputProps={{
              sx: {
                borderRadius: 2,
                "&:hover fieldset": { borderColor: "#6a11cb" },
                "&.Mui-focused fieldset": { borderColor: "#2575fc" },
              },
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
              sx: {
                borderRadius: 2,
                "&:hover fieldset": { borderColor: "#6a11cb" },
                "&.Mui-focused fieldset": { borderColor: "#2575fc" },
              },
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
                  <IconButton onClick={handleToggleConfirmPassword} edge="end">
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                "&:hover fieldset": { borderColor: "#6a11cb" },
                "&.Mui-focused fieldset": { borderColor: "#2575fc" },
              },
            }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              mt: 3,
              py: 1.5,
              fontSize: "1rem",
              fontWeight: "bold",
              borderRadius: 2,
              background: "linear-gradient(45deg, #6a11cb, #2575fc)",
              "&:hover": {
                background: "linear-gradient(45deg, #5b0ec9, #1f66e5)",
              },
            }}
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
          mt={2}
          variant="body2"
          color={isDarkMode ? "#bbb" : "#444"}
        >
          Đã có tài khoản?{" "}
          <Button
            onClick={() => navigate("/login")}
            sx={{
              textTransform: "none",
              color: "#6a11cb",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Đăng Nhập
          </Button>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterPage;
