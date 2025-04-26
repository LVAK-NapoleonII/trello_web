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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const transition = { duration: 0.5, ease: "easeInOut" };

  const validatePassword = (pwd) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

    if (pwd.length < minLength) {
      return "Mật khẩu phải có ít nhất 8 ký tự!";
    }
    if (!hasUpperCase) {
      return "Mật khẩu phải chứa ít nhất một chữ cái in hoa!";
    }
    if (!hasLowerCase) {
      return "Mật khẩu phải chứa ít nhất một chữ cái thường!";
    }
    if (!hasNumber) {
      return "Mật khẩu phải chứa ít nhất một số!";
    }
    if (!hasSpecialChar) {
      return "Mật khẩu phải chứa ít nhất một ký tự đặc biệt!";
    }
    return "";
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      console.log("Sending OTP request:", { email });
      const response = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { email: email.trim() }
      );
      toast.success(response.data.message);
      setStep(2);
    } catch (err) {
      const message =
        err.response?.data?.message || "Không thể gửi OTP. Vui lòng thử lại!";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("Resending OTP request:", { email });
      const response = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { email: email.trim() }
      );
      toast.success("OTP đã được gửi lại!");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Không thể gửi lại OTP. Vui lòng thử lại!";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    const passwordError = validatePassword(trimmedPassword);
    if (passwordError) {
      setError(passwordError);
      toast.error(passwordError);
      setLoading(false);
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setError("Mật khẩu không khớp!");
      toast.error("Mật khẩu không khớp!");
      setLoading(false);
      return;
    }

    try {
      console.log("Sending reset password request:", {
        email,
        otp,
        newPassword: trimmedPassword,
      });
      const response = await axios.post(
        "http://localhost:5000/api/auth/reset-password",
        { email: email.trim(), otp: otp.trim(), newPassword: trimmedPassword }
      );
      toast.success(response.data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const message =
        err.response?.status === 401
          ? "OTP không hợp lệ hoặc đã hết hạn. Vui lòng thử gửi lại OTP!"
          : err.response?.data?.message ||
            "Không thể đặt lại mật khẩu. Vui lòng thử lại!";
      setError(message);
      toast.error(message);
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
        transition: "background 0.3s ease",
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
          borderRadius: 12,
          bgcolor: (theme) =>
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
          variant="h5"
          fontWeight="bold"
          mb={3}
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transition}
          sx={{ color: (theme) => theme.palette.text.primary }}
        >
          {step === 1 ? "Quên mật khẩu" : "Nhập mã xác nhận và đặt lại"}
        </Typography>

        {error && (
          <Typography
            color="error"
            mb={2}
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </Typography>
        )}

        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <form onSubmit={handleSendOTP}>
              <TextField
                fullWidth
                label="Nhập Email"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                sx={{
                  mb: 3,
                  bgcolor: (theme) => theme.palette.background.paper,
                  borderRadius: 8,
                }}
                disabled={loading}
              />
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={!email || loading}
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
                  "Gửi mã xác nhận"
                )}
              </Button>
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <form onSubmit={handleResetPassword}>
              <TextField
                fullWidth
                label="Nhập mã OTP"
                variant="outlined"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoComplete="one-time-code"
                sx={{
                  mb: 3,
                  bgcolor: (theme) => theme.palette.background.paper,
                  borderRadius: 8,
                }}
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Mật khẩu mới"
                type="password"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                sx={{
                  mb: 3,
                  bgcolor: (theme) => theme.palette.background.paper,
                  borderRadius: 8,
                }}
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Xác nhận mật khẩu mới"
                type="password"
                variant="outlined"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                sx={{
                  mb: 3,
                  bgcolor: (theme) => theme.palette.background.paper,
                  borderRadius: 8,
                }}
                disabled={loading}
              />
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={!otp || !password || !confirmPassword || loading}
                sx={{
                  py: 1.2,
                  borderRadius: 8,
                  background: "linear-gradient(45deg, #6a11cb, #2575fc)",
                  "&:hover": {
                    background: "linear-gradient(45deg, #5b0ec9, #1f66e5)",
                  },
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  mb: 2,
                }}
                component={motion.button}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Xác nhận và đặt lại"
                )}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleResendOTP}
                disabled={loading}
                sx={{
                  borderRadius: 8,
                  borderColor: (theme) => theme.palette.divider,
                  color: (theme) => theme.palette.text.primary,
                  "&:hover": {
                    borderColor: (theme) => theme.palette.primary.main,
                    bgcolor: (theme) => theme.palette.action.hover,
                  },
                }}
                component={motion.button}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Gửi lại OTP
              </Button>
            </form>
          </motion.div>
        )}
      </Container>
    </Box>
  );
};

export default ForgotPassword;
