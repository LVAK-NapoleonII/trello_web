import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  useTheme,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const VerifyOTPPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDarkMode = theme.palette.mode === "dark";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Lấy email từ state
  const email = location.state?.email || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError("Vui lòng nhập mã OTP!");
      return;
    }

    try {
      // Gọi API xác thực OTP
      const response = await axios.post(
        "http://localhost:5000/api/auth/verify-otp",
        {
          email,
          otp,
        }
      );

      setSuccess("Xác thực thành công! Bạn có thể đăng nhập.");
      setError("");
      setTimeout(() => {
        navigate("/login");
      }, 2000); // Chuyển hướng sau 2 giây
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Đã có lỗi xảy ra. Vui lòng thử lại!");
      }
      setSuccess("");
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
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          mb={2}
          textAlign="center"
          color="primary"
        >
          Xác Thực OTP
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Typography variant="body1" mb={2} textAlign="center">
          Một mã OTP đã được gửi đến email: <strong>{email}</strong>
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Mã OTP"
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value);
              setError("");
              setSuccess("");
            }}
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

          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{
              mt: 2,
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
            Xác Thực
          </Button>
        </form>

        <Typography
          textAlign="center"
          mt={2}
          variant="body2"
          color={isDarkMode ? "#bbb" : "#444"}
        >
          Quay lại{" "}
          <Button
            onClick={() => navigate("/register")}
            sx={{
              textTransform: "none",
              color: "#6a11cb",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Đăng Ký
          </Button>
        </Typography>
      </Box>
    </Box>
  );
};

export default VerifyOTPPage;
