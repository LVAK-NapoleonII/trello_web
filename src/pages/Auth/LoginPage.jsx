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
import axios from "axios";
import { useAuth } from "../../context/AuthContext.jsx";

const LoginPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDarkMode = theme.palette.mode === "dark";
  const { login } = useAuth();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isDarkMode
          ? "#121212"
          : "linear-gradient(135deg, #6a11cb, #2575fc)",
        p: 3,
      }}
    >
      <Box
        sx={{
          width: "400px",
          p: 4,
          borderRadius: 3,
          background: isDarkMode ? "#1e1e1e" : "#ffffff",
          boxShadow: isDarkMode ? 3 : "0px 4px 10px rgba(0, 0, 0, 0.2)",
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          mb={2}
          textAlign="center"
          color={isDarkMode ? "white" : "primary"}
        >
          Đăng Nhập
        </Typography>

        <LoginForm navigate={navigate} login={login} />
      </Box>
    </Box>
  );
};

const LoginForm = ({ navigate, login }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Vui lòng nhập email và mật khẩu!");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email: formData.email,
          password: formData.password,
        }
      );

      // Lưu thông tin user và token vào context
      login(response.data.user, response.data.token);

      navigate("/");
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Đã có lỗi xảy ra. Vui lòng thử lại!");
      }
    }
  };

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Mật khẩu"
          name="password"
          type={showPassword ? "text" : "password"}
          value={formData.password}
          onChange={handleChange}
          margin="normal"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          fullWidth
          type="submit"
          variant="contained"
          sx={{
            mt: 2,
            py: 1.5,
            fontSize: "1rem",
            fontWeight: "bold",
          }}
        >
          Đăng Nhập
        </Button>
      </form>

      <Typography textAlign="center" mt={2} variant="body2">
        Chưa có tài khoản?{" "}
        <Button
          onClick={() => navigate("/register")}
          sx={{ textTransform: "none" }}
        >
          Đăng Ký
        </Button>
      </Typography>
    </>
  );
};

export default LoginPage;
