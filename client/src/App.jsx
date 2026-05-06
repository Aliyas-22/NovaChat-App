import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import ProtectedRoute from "./components/UI/ProtectedRoute";
import NotificationManager from "./components/UI/NotificationManager";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";
import "./index.css";

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ChatProvider>
                    <NotificationManager />
                    <Toaster
                        toastOptions={{
                            style: {
                                background: "rgba(15,20,40,0.95)",
                                color: "#f1f5f9",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "12px",
                                backdropFilter: "blur(20px)",
                                fontSize: "14px",
                            },
                            success: {
                                iconTheme: {
                                    primary: "#10b981",
                                    secondary: "#070b14",
                                },
                            },
                            error: {
                                iconTheme: {
                                    primary: "#ef4444",
                                    secondary: "#070b14",
                                },
                            },
                        }}
                    />
                    <Routes>
                        <Route path="/" element={<Navigate to="/chat" replace />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route
                            path="/chat"
                            element={
                                <ProtectedRoute>
                                    <ChatPage />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </ChatProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}