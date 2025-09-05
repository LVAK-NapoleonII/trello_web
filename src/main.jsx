import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom"; // Thêm BrowserRouter
import App from "./App.jsx";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme.js";
import { Experimental_CssVarsProvider as CssVarsProvider } from "@mui/material/styles";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SocketProvider } from "./context/SocketContext.jsx";
import ErrorBoundary from "./ErrorBoundary";
import { AuthProvider } from "./context/AuthContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Router> {/* Bọc toàn bộ ứng dụng trong Router */}
    <AuthProvider>
      <SocketProvider>
        <ErrorBoundary>
          <CssVarsProvider theme={theme}>
            <CssBaseline />
            <App />
            <ToastContainer position="top-right" autoClose={3000} />
          </CssVarsProvider>
        </ErrorBoundary>
      </SocketProvider>
    </AuthProvider>
  </Router>
);