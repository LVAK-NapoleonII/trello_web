import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Container,
} from "@mui/material";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Hiệu ứng chuyển bước
  const transition = { duration: 0.5, ease: "easeInOut" };

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { email }
      );
      toast.success(response.data.message);
      setStep(2);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể gửi OTP. Vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/reset-password",
        { email, otp, newPassword: password }
      );
      toast.success(response.data.message);
      setStep(3);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "OTP không hợp lệ. Vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/reset-password",
        { email, otp, newPassword: password }
      );
      toast.success(response.data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Không thể đặt lại mật khẩu. Vui lòng thử lại!"
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
        background: "linear-gradient(135deg, #667eea, #764ba2)",
      }}
    >
      <Container
        maxWidth="xs"
        component={motion.div}
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
        sx={{
          p: 4,
          borderRadius: 3,
          bgcolor: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
          textAlign: "center",
        }}
      >
        <Typography
          variant="h5"
          fontWeight="bold"
          color="white"
          mb={3}
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transition}
        >
          {step === 1
            ? "Quên mật khẩu"
            : step === 2
            ? "Nhập mã xác nhận"
            : "Đặt lại mật khẩu"}
        </Typography>

        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TextField
              fullWidth
              label="Nhập Email"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 3, bgcolor: "white", borderRadius: 1 }}
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleSendOTP}
              disabled={!email || loading}
              sx={{
                bgcolor: "#6a11cb",
                "&:hover": { bgcolor: "#2575fc" },
                color: "white",
                transition: "0.3s",
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Gửi mã xác nhận"
              )}
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TextField
              fullWidth
              label="Nhập mã OTP"
              variant="outlined"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              sx={{ mb: 3, bgcolor: "white", borderRadius: 1 }}
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleVerifyOTP}
              disabled={!otp || loading}
              sx={{
                bgcolor: "#6a11cb",
                "&:hover": { bgcolor: "#2575fc" },
                color: "white",
                transition: "0.3s",
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Xác nhận"
              )}
            </Button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TextField
              fullWidth
              label="Mật khẩu mới"
              type="password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3, bgcolor: "white", borderRadius: 1 }}
            />
            <Button
              fullWidth
              variant="contained"
              color="success"
              onClick={handleResetPassword}
              disabled={!password || loading}
              sx={{
                bgcolor: "#28a745",
                "&:hover": { bgcolor: "#218838" },
                transition: "0.3s",
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Hoàn tất"
              )}
            </Button>
          </motion.div>
        )}
      </Container>
    </Box>
  );
};

export default ForgotPassword;
