import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Board from "./pages/Boards/Boards";
import HomePage from "./pages/HomePage/HomePage";
import AppBar from "./components/AppBar/AppBar";
import RegisterPage from "./pages/Auth/RegisterPage";
import LoginPage from "./pages/Auth/LoginPage";
import ProfilePage from "./pages/Auth/ProfilePage";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import VerifyOTPPage from "./pages/Auth/VerifyOTPPage";
import { AuthProvider } from "./context/AuthContext.jsx";
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/Register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/board" element={<Board />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTPPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
