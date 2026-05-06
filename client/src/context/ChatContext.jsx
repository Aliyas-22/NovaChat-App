import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
} from "react";
import { getSocket } from "../utils/socket";
import api from "../utils/api";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [activeContact, setActiveContact] = useState(null);
    const [messages, setMessages] = useState({});
    const [unreadCounts, setUnreadCounts] = useState({});
    const [typingUsers, setTypingUsers] = useState({});
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [notifications, setNotifications] = useState([]);
    const messageCache = useRef({});

    useEffect(() => {
        if (!user) return;
        const socket = getSocket();
        if (!socket) return;

        const handleReceive = (msg) => {
            const senderId = msg.sender._id;
            delete messageCache.current[senderId];
            setMessages((prev) => {
                const existing = prev[senderId] || [];
                if (existing.find((m) => m._id === msg._id)) return prev;
                return {
                    ...prev,
                    [senderId]: [...existing, msg],
                };
            });
            setUnreadCounts((prev) => ({
                ...prev,
                [senderId]: (prev[senderId] || 0) + 1,
            }));
        };

        const handleSent = (msg) => {
            const receiverId = msg.receiver._id;
            delete messageCache.current[receiverId];
            setMessages((prev) => {
                const existing = prev[receiverId] || [];
                if (existing.find((m) => m._id === msg._id)) return prev;
                return {
                    ...prev,
                    [receiverId]: [...existing, msg],
                };
            });
        };

        const handleReactionUpdate = ({ messageId, reactions }) => {
            setMessages((prev) => {
                const updated = { ...prev };
                for (const key of Object.keys(updated)) {
                    updated[key] = updated[key].map((m) =>
                        m._id === messageId ? { ...m, reactions } : m
                    );
                }
                return updated;
            });
        };

        const handleDeleted = ({ messageId }) => {
            setMessages((prev) => {
                const updated = { ...prev };
                for (const key of Object.keys(updated)) {
                    updated[key] = updated[key].map((m) =>
                        m._id === messageId
                            ? {
                                ...m,
                                isDeleted: true,
                                content: "This message was deleted",
                            }
                            : m
                    );
                }
                return updated;
            });
        };

        const handleTypingStart = ({ userId }) => {
            setTypingUsers((prev) => ({ ...prev, [userId]: true }));
        };

        const handleTypingStop = ({ userId }) => {
            setTypingUsers((prev) => {
                const next = { ...prev };
                delete next[userId];
                return next;
            });
        };

        const handleUserOnline = ({ userId, isOnline, lastSeen }) => {
            setOnlineUsers((prev) => {
                const next = new Set(prev);
                if (isOnline) next.add(userId.toString());
                else next.delete(userId.toString());
                return next;
            });
            setContacts((prev) =>
                prev.map((c) =>
                    c._id === userId
                        ? {
                            ...c,
                            isOnline,
                            lastSeen: lastSeen || c.lastSeen,
                        }
                        : c
                )
            );
        };

        const handleNotification = (notif) => {
            setNotifications((prev) => [notif, ...prev].slice(0, 20));
        };

        // INSTANT BLUE TICK FIX
        const handleReadAck = ({ readBy, senderId }) => {
            setMessages((prev) => {
                const updated = { ...prev };
                for (const key of Object.keys(updated)) {
                    updated[key] = updated[key].map((m) => {
                        if (
                            m.sender._id === user._id ||
                            m.sender === user._id
                        ) {
                            return { ...m, isRead: true };
                        }
                        return m;
                    });
                }
                return updated;
            });
        };

        socket.on("message:receive", handleReceive);
        socket.on("message:sent", handleSent);
        socket.on("message:reaction:update", handleReactionUpdate);
        socket.on("message:deleted", handleDeleted);
        socket.on("typing:start", handleTypingStart);
        socket.on("typing:stop", handleTypingStop);
        socket.on("user:online", handleUserOnline);
        socket.on("notification:new", handleNotification);
        socket.on("message:read:ack", handleReadAck);

        return () => {
            socket.off("message:receive", handleReceive);
            socket.off("message:sent", handleSent);
            socket.off("message:reaction:update", handleReactionUpdate);
            socket.off("message:deleted", handleDeleted);
            socket.off("typing:start", handleTypingStart);
            socket.off("typing:stop", handleTypingStop);
            socket.off("user:online", handleUserOnline);
            socket.off("notification:new", handleNotification);
            socket.off("message:read:ack", handleReadAck);
        };
    }, [user]);

    const loadContacts = useCallback(async () => {
        try {
            const { data } = await api.get("/users/contacts");
            setContacts(data.contacts || []);
        } catch (err) { }
    }, []);

    const loadMessages = useCallback(async (contactId) => {
        if (messageCache.current[contactId]) {
            setMessages((prev) => ({
                ...prev,
                [contactId]: messageCache.current[contactId],
            }));
            return;
        }
        try {
            const { data } = await api.get(`/messages/${contactId}`);
            messageCache.current[contactId] = data.messages;
            setMessages((prev) => ({
                ...prev,
                [contactId]: data.messages,
            }));
        } catch (err) { }
    }, []);

    const selectContact = useCallback(
        async (contact) => {
            setActiveContact(contact);
            setUnreadCounts((prev) => ({ ...prev, [contact._id]: 0 }));
            await loadMessages(contact._id);
            const socket = getSocket();
            if (socket)
                socket.emit("message:read", { senderId: contact._id });
        },
        [loadMessages]
    );

    const sendMessage = useCallback(
        (receiverId, content, type = "text", extra = {}) => {
            const socket = getSocket();
            if (!socket) return;
            socket.emit("message:send", {
                receiverId,
                content,
                type,
                ...extra,
            });
        },
        []
    );

    const sendReaction = useCallback(
        (messageId, emoji, receiverId) => {
            const socket = getSocket();
            if (socket)
                socket.emit("message:reaction", {
                    messageId,
                    emoji,
                    receiverId,
                });
        },
        []
    );

    const deleteMessage = useCallback((messageId, receiverId) => {
        const socket = getSocket();
        if (socket)
            socket.emit("message:delete", { messageId, receiverId });
    }, []);

    const sendTyping = useCallback((receiverId, isTyping) => {
        const socket = getSocket();
        if (socket) {
            socket.emit(isTyping ? "typing:start" : "typing:stop", {
                receiverId,
            });
        }
    }, []);

    const clearNotifications = useCallback(
        () => setNotifications([]),
        []
    );

    return (
        <ChatContext.Provider
            value={{
                contacts,
                activeContact,
                messages,
                unreadCounts,
                typingUsers,
                onlineUsers,
                notifications,
                loadContacts,
                loadMessages,
                selectContact,
                sendMessage,
                sendReaction,
                deleteMessage,
                sendTyping,
                clearNotifications,
                setContacts,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const ctx = useContext(ChatContext);
    if (!ctx)
        throw new Error("useChat must be used inside ChatProvider");
    return ctx;
};