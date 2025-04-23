import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async (retries = 3, delay = 1000) => {
      const token = localStorage.getItem("token");
      console.log("AuthContext: Verifying token:", {
        token: token ? "present" : "missing",
      });

      if (!token) {
        console.log("AuthContext: No token found, setting loading to false");
        setUser(null);
        localStorage.removeItem("user");
        setLoading(false);
        return;
      }

      for (let i = 0; i < retries; i++) {
        try {
          console.log(
            `AuthContext: Fetching user profile (attempt ${i + 1}/${retries})`
          );
          const response = await axios.get(
            "http://localhost:5000/api/auth/profile",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              withCredentials: true,
            }
          );

          const userData = response.data.user;
          console.log("AuthContext: User profile fetched:", {
            _id: userData._id,
            email: userData.email,
          });
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
          setLoading(false);
          return;
        } catch (error) {
          console.error(
            `AuthContext: Error verifying token (attempt ${i + 1}/${retries}):`,
            {
              message: error.message,
              status: error.response?.status,
              data: error.response?.data,
            }
          );

          if (error.response?.status === 401) {
            console.log("AuthContext: Token expired, attempting to refresh");
            try {
              const refreshResponse = await axios.post(
                "http://localhost:5000/api/auth/refresh-token",
                {},
                { withCredentials: true }
              );
              const newToken = refreshResponse.data.token;
              console.log("AuthContext: Token refreshed:", { newToken });

              localStorage.setItem("token", newToken);

              const profileResponse = await axios.get(
                "http://localhost:5000/api/auth/profile",
                {
                  headers: {
                    Authorization: `Bearer ${newToken}`,
                  },
                  withCredentials: true,
                }
              );
              const userData = profileResponse.data.user;
              console.log("AuthContext: User profile fetched with new token:", {
                _id: userData._id,
                email: userData.email,
              });
              setUser(userData);
              localStorage.setItem("user", JSON.stringify(userData));
              setLoading(false);
              return;
            } catch (refreshError) {
              console.error("AuthContext: Error refreshing token:", {
                message: refreshError.message,
                status: refreshError.response?.status,
                data: refreshError.response?.data,
              });
              toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
              setUser(null);
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              setLoading(false);
              return;
            }
          } else if (i < retries - 1) {
            console.log(`AuthContext: Retrying after ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          } else {
            console.log("AuthContext: Non-401 error, clearing user data");
            toast.error("Lỗi xác thực người dùng. Vui lòng đăng nhập lại!");
            setUser(null);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setLoading(false);
            return;
          }
        }
      }
    };

    verifyToken();
  }, []);

  const login = async (userData, token) => {
    console.log("AuthContext: Logging in user:", {
      _id: userData._id,
      email: userData.email,
    });
    setUser(userData);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    toast.success("Đăng nhập thành công!");
  };

  const logout = async () => {
    console.log("AuthContext: Logging out user");
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("AuthContext: No token found, clearing client-side data");
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast.success("Đăng xuất thành công!");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/auth/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      console.log("AuthContext: Logout API called successfully");
      toast.success("Đăng xuất thành công!");
    } catch (error) {
      console.error("AuthContext: Error during logout:", {
        message: error.message,
        status: error.response?.status,
      });
      toast.error("Lỗi khi đăng xuất, nhưng đã xóa dữ liệu phía client!");
    } finally {
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
