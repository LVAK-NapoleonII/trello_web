import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Board from "./pages/Boards/Boards";
import HomePage from "./pages/HomePage/HomePage";
import AppBar from "./components/AppBar/AppBar";
import RegisterPage from "./pages/Auth/RegisterPage";
import LoginPage from "./pages/Auth/LoginPage";
import ProfilePage from "./pages/Auth/ProfilePage";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import VerifyOTPPage from "./pages/Auth/VerifyOTPPage";
import WorkspaceBoardsPage from "./pages/Workspace/WorkspaceBoardsPage.jsx";
import WorkspaceMembersPage from "./pages/Workspace/WorkspaceMembersPage.jsx";
import WorkspaceSettingsPage from "./pages/Workspace/WorkspaceSettingsPage.jsx";

function App() {
  return (
    <Router>
      <AppBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/boards" element={<HomePage />} />
        <Route path="/Register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/board" element={<Board />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTPPage />} />
        <Route path="/workspace/:id/boards" element={<WorkspaceBoardsPage />} />
        <Route
          path="/workspace/:id/members"
          element={<WorkspaceMembersPage />}
        />
        <Route
          path="/workspace/:id/settings"
          element={<WorkspaceSettingsPage />}
        />
        <Route
          path="/workspace/:workspaceId/board/:boardId"
          element={<Board />}
        />
      </Routes>
    </Router>
  );
}

export default App;
