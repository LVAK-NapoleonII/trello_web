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
import { motion } from "framer-motion";

const VerifyOTPPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const email = location.state?.email || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError("Vui lòng nhập mã OTP!");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/verify-otp",
        {
          email,
          otp,
        }
      );
      setSuccess("Xác thực thành công! Bạn có thể đăng nhập.");
      setError("");
      setTimeout(() => navigate("/login"), 2000);
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
            textAlign: "center",
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
            Xác Thực OTP
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
          {success && (
            <Alert
              severity="success"
              sx={{ mb: 2, borderRadius: 8 }}
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {success}
            </Alert>
          )}

          <Typography
            variant="body1"
            mb={3}
            color="text.secondary"
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
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
              Xác Thực
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
            Quay lại{" "}
            <Button
              onClick={() => navigate("/register")}
              sx={{
                textTransform: "none",
                color: "primary.main",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Đăng Ký
            </Button>
          </Typography>
        </Box>
      </motion.div>
    </Box>
  );
};

export default VerifyOTPPage;
