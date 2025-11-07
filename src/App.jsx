import { Routes, Route, useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import Board from "./pages/Boards/Boards";
import HomePage from "./pages/HomePage/HomePage";
import AppBar from "./components/AppBar/AppBar";
import RegisterPage from "./pages/Auth/RegisterPage";
import LoginPage from "./pages/Auth/LoginPage";
import ProfilePage from "./pages/Auth/ProfilePage";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import VerifyOTPPage from "./pages/Auth/VerifyOTPPage";
import WorkspaceMembersPage from "./pages/Workspace/WorkspaceMembersPage.jsx";
import WorkspaceSettingsPage from "./pages/Workspace/WorkspaceSettingsPage.jsx";
import { AdminDashboard } from "./admin/dashboard/AdminDashboard.jsx"

function App() {
  const location = useLocation();
  const publicRoutes = ["/register", "/login", "/forgot-password", "/verify-otp"];

  // Chỉ hiển thị AppBar nếu không phải route công khai
  const showAppBar = !publicRoutes.includes(location.pathname.toLowerCase());

  return (
    <>
      {showAppBar && <AppBar />}
      <Box
        sx={{
          paddingTop: (theme) =>
            showAppBar ? theme.trelloCustom.appBarHeight : 0,
          minHeight: "100vh",
          overflow: "auto",
        }}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/boards" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/board" element={<Board />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTPPage />} />
          <Route path="/workspace/:workspaceId/members" element={<WorkspaceMembersPage />} />
          <Route path="/workspace/:workspaceId/settings" element={<WorkspaceSettingsPage />} />
          <Route path="/workspace/:workspaceId/board/:boardId" element={<Board />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
      </Box>
    </>
  );
}

export default App;