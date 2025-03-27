import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Board from "./pages/Boards/Boards";
import HomePage from "./pages/HomePage/HomePage";
import AppBar from "./components/AppBar/AppBar";
import RegisterPage from "./pages/Auth/RegisterPage";
import LoginPage from "./pages/Auth/LoginPage";
import ProfilePage from "./pages/Auth/ProfilePage";
import ForgotPassword from "./pages/Auth/ForgotPassword";

function App() {
  return (
    <Router>
      <AppBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/Register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/board" element={<Board />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
