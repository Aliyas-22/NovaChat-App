import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div
                style={{
                    height: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#070b14",
                    gap: 16,
                }}
            >
                <svg width="44" height="44" viewBox="0 0 28 28" fill="none">
                    <path
                        d="M14 2L26 8V20L14 26L2 20V8L14 2Z"
                        fill="url(#splashGrad)"
                    />
                    <path
                        d="M9 14L13 18L19 10"
                        stroke="white"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <defs>
                        <linearGradient
                            id="splashGrad"
                            x1="2" y1="2" x2="26" y2="26"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop stopColor="#8b5cf6" />
                            <stop offset="1" stopColor="#06b6d4" />
                        </linearGradient>
                    </defs>
                </svg>
                <div
                    style={{
                        width: 32,
                        height: 32,
                        border: "2px solid rgba(139,92,246,0.2)",
                        borderTop: "2px solid #8b5cf6",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                    }}
                />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return user ? children : <Navigate to="/login" replace />;
}