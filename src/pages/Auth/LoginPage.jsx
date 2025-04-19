import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  useTheme,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material"; // Thêm icon
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const LoginPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Thêm trạng thái showPassword

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        }
      );

      const { token, refreshToken, user } = response.data;
      login(user, token, refreshToken);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  // Hàm xử lý hiện/ẩn mật khẩu
  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        p: 3,
      }}
    >
      <Box
        sx={{
          width: "400px",
          p: 4,
          borderRadius: 3,
          background: theme.palette.mode === "dark" ? "#161b22" : "#fff",
          boxShadow:
            theme.palette.mode === "dark"
              ? 3
              : "0px 4px 10px rgba(0, 0, 0, 0.1)",
          textAlign: "center",
        }}
      >
        <Typography variant="h5" fontWeight="bold" mb={3}>
          Đăng Nhập
        </Typography>
        {error && (
          <Typography color="error" mb={2}>
            {error}
          </Typography>
        )}
        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
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
            type={showPassword ? "text" : "password"} // Chuyển đổi type dựa trên showPassword
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                  >
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
          <Button
            type="submit"
            variant="contained"
            sx={{
              mt: 2,
              width: "100%",
              bgcolor: "#6a11cb",
              "&:hover": { bgcolor: "#2575fc" },
              color: "white",
              transition: "0.3s",
            }}
          >
            Đăng Nhập
          </Button>
        </form>
        <Typography mt={2}>
          Chưa có tài khoản?{" "}
          <Button onClick={() => navigate("/register")}>Đăng ký</Button>
        </Typography>
        <Typography mt={1}>
          <Button onClick={() => navigate("/forgot-password")}>
            Quên mật khẩu?
          </Button>
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;
