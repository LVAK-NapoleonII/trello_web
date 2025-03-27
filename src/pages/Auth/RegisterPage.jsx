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
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Xóa lỗi khi người dùng nhập lại
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu không khớp!");
      return;
    }
    console.log("Register Data:", formData);
    navigate("/login"); // Chuyển hướng sang trang đăng nhập sau khi đăng ký thành công
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
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)}>
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
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
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
            Đăng Ký
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
