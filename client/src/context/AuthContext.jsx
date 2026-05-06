import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react";
import api from "../utils/api";
import { initSocket, disconnectSocket } from "../utils/socket";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem("novachat_user");
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);

    // Verify token on mount
    useEffect(() => {
        const verify = async () => {
            const token = localStorage.getItem("novachat_token");
            if (token) {
                try {
                    const { data } = await api.get("/auth/me");
                    setUser(data.user);
                    initSocket(token);
                } catch {
                    logout();
                }
            }
            setLoading(false);
        };
        verify();
    }, []);

    const login = useCallback(async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("novachat_token", data.token);
        localStorage.setItem("novachat_user", JSON.stringify(data.user));
        setUser(data.user);
        initSocket(data.token);
        return data;
    }, []);

    const register = useCallback(async (username, email, password) => {
        const { data } = await api.post("/auth/register", {
            username,
            email,
            password,
        });
        localStorage.setItem("novachat_token", data.token);
        localStorage.setItem("novachat_user", JSON.stringify(data.user));
        setUser(data.user);
        initSocket(data.token);
        return data;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("novachat_token");
        localStorage.removeItem("novachat_user");
        disconnectSocket();
        setUser(null);
    }, []);

    const updateUser = useCallback((updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem("novachat_user", JSON.stringify(updatedUser));
    }, []);

    return (
        <AuthContext.Provider
            value={{ user, loading, login, register, logout, updateUser }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
};