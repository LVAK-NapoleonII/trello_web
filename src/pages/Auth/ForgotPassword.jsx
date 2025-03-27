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

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Hiệu ứng chuyển bước
  const transition = { duration: 0.5, ease: "easeInOut" };

  const handleNextStep = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(step + 1);
    }, 1000);
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
              onClick={handleNextStep}
              disabled={!email}
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
              onClick={handleNextStep}
              disabled={!otp}
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
              sx={{
                bgcolor: "#28a745",
                "&:hover": { bgcolor: "#218838" },
                transition: "0.3s",
              }}
            >
              Hoàn tất
            </Button>
          </motion.div>
        )}
      </Container>
    </Box>
  );
};

export default ForgotPassword;
