import { useEffect, useRef } from "react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import Avatar from "./Avatar";

export default function NotificationManager() {
    const { notifications } = useChat();
    const { user } = useAuth();
    const lastNotifRef = useRef(null);

    useEffect(() => {
        if (!notifications.length) return;
        const latest = notifications[0];

        if (lastNotifRef.current === latest) return;
        lastNotifRef.current = latest;

        if (latest.from?._id === user?._id) return;

        toast.custom(
            (t) => (
                <div
                    onClick={() => toast.dismiss(t.id)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        background: "rgba(15,20,40,0.95)",
                        border: "1px solid rgba(139,92,246,0.3)",
                        borderRadius: 14,
                        padding: "12px 16px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                        cursor: "pointer",
                        minWidth: 280,
                        maxWidth: 340,
                        backdropFilter: "blur(20px)",
                        opacity: t.visible ? 1 : 0,
                        transition: "opacity 0.3s ease",
                    }}
                >
                    <Avatar
                        username={latest.from?.username}
                        avatar={latest.from?.avatar}
                        size={38}
                        online
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#f1f5f9",
                                marginBottom: 3,
                            }}
                        >
                            {latest.from?.username}
                        </div>
                        <div
                            style={{
                                fontSize: 12,
                                color: "#94a3b8",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {latest.content}
                        </div>
                    </div>
                    <div
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                            flexShrink: 0,
                        }}
                    />
                </div>
            ),
            { duration: 3500, position: "top-right" }
        );
    }, [notifications, user]);

    return null;
}