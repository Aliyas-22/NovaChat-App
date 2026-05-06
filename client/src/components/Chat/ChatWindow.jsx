import { useState, useEffect, useRef, useCallback } from "react";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import Avatar from "../UI/Avatar";
import MessageBubble from "./MessageBubble";
import { formatDistanceToNow } from "date-fns";
import styles from "./ChatWindow.module.css";

export default function ChatWindow() {
    const { user } = useAuth();
    const {
        activeContact,
        messages,
        typingUsers,
        sendMessage,
        sendTyping,
        onlineUsers,
    } = useChat();
    const [input, setInput] = useState("");
    const [showEmoji, setShowEmoji] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const fileRef = useRef(null);
    const typingTimeout = useRef(null);
    const isTypingRef = useRef(false);

    const contactMessages = messages[activeContact?._id] || [];
    const isContactOnline =
        onlineUsers.has(activeContact?._id) || activeContact?.isOnline;
    const isContactTyping = typingUsers[activeContact?._id];

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [contactMessages, isContactTyping]);

    useEffect(() => {
        inputRef.current?.focus();
        setInput("");
        setShowEmoji(false);
    }, [activeContact?._id]);

    const handleSend = useCallback(() => {
        const text = input.trim();
        if (!text) return;
        sendMessage(activeContact._id, text, "text");
        setInput("");
        setShowEmoji(false);
        sendTyping(activeContact._id, false);
        isTypingRef.current = false;
        inputRef.current?.focus();
    }, [input, activeContact, sendMessage, sendTyping]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            sendTyping(activeContact._id, true);
        }
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            isTypingRef.current = false;
            sendTyping(activeContact._id, false);
        }, 1500);
    };

    const handleEmojiClick = (emojiData) => {
        setInput((prev) => prev + emojiData.emoji);
        inputRef.current?.focus();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const MAX = 5 * 1024 * 1024;
        if (file.size > MAX) {
            alert("File too large (max 5MB)");
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            const isImage = file.type.startsWith("image/");
            sendMessage(
                activeContact._id,
                file.name,
                isImage ? "image" : "file",
                {
                    fileUrl: dataUrl,
                    fileName: file.name,
                    fileSize: file.size,
                }
            );
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const grouped = contactMessages.reduce((acc, msg) => {
        const dateKey = new Date(msg.createdAt).toDateString();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(msg);
        return acc;
    }, {});

    return (
        <div className={styles.window}>
            {/* Header */}
            <div className={styles.header}>
                <Avatar
                    username={activeContact.username}
                    avatar={activeContact.avatar}
                    size={42}
                    online={isContactOnline}
                />
                <div className={styles.headerInfo}>
                    <span className={styles.headerName}>
                        {activeContact.username}
                    </span>
                    <span
                        className={`${styles.headerStatus} ${isContactOnline ? styles.online : ""
                            }`}
                    >
                        {isContactOnline
                            ? "Active now"
                            : activeContact.lastSeen
                                ? `Last seen ${formatDistanceToNow(
                                    new Date(activeContact.lastSeen),
                                    { addSuffix: true }
                                )}`
                                : "Offline"}
                    </span>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.headerBtn} title="Voice call">
                        <svg
                            width="18" height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.88-1.88a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                    </button>
                    <button className={styles.headerBtn} title="Video call">
                        <svg
                            width="18" height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div
                className={styles.messages}
                onClick={() => setShowEmoji(false)}
            >
                {contactMessages.length === 0 && (
                    <div className={styles.emptyMessages}>
                        <div className={styles.emptyAvatar}>
                            <Avatar
                                username={activeContact.username}
                                avatar={activeContact.avatar}
                                size={64}
                            />
                        </div>
                        <p className={styles.emptyTitle}>
                            {activeContact.username}
                        </p>
                        <p className={styles.emptySub}>Say hello 👋</p>
                    </div>
                )}

                {Object.entries(grouped).map(([date, msgs]) => (
                    <div key={date}>
                        <div className={styles.dateDivider}>
                            <span className={styles.dateLabel}>
                                {new Date(date).toDateString() ===
                                    new Date().toDateString()
                                    ? "Today"
                                    : new Date(date).toDateString() ===
                                        new Date(Date.now() - 86400000).toDateString()
                                        ? "Yesterday"
                                        : date}
                            </span>
                        </div>
                        {msgs.map((msg, i) => (
                            <MessageBubble
                                key={msg._id}
                                msg={msg}
                                showAvatar={
                                    i === 0 ||
                                    msgs[i - 1]?.sender?._id !== msg.sender?._id
                                }
                                isLast={
                                    i === msgs.length - 1 ||
                                    msgs[i + 1]?.sender?._id !== msg.sender?._id
                                }
                            />
                        ))}
                    </div>
                ))}

                {isContactTyping && (
                    <div className={styles.typingRow}>
                        <div className={styles.typingBubble}>
                            <span className={styles.typingDot} />
                            <span className={styles.typingDot} />
                            <span className={styles.typingDot} />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Emoji Picker */}
            {showEmoji && (
                <div className={styles.emojiPickerWrap}>
                    <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        theme="dark"
                        skinTonesDisabled
                        height={360}
                        width="100%"
                    />
                </div>
            )}

            {/* Input Bar */}
            <div className={styles.inputBar}>
                <button
                    className={`${styles.inputBtn} ${showEmoji ? styles.active : ""
                        }`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowEmoji(!showEmoji);
                    }}
                >
                    <svg
                        width="20" height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                        <line x1="9" y1="9" x2="9.01" y2="9" />
                        <line x1="15" y1="9" x2="15.01" y2="9" />
                    </svg>
                </button>

                <button
                    className={styles.inputBtn}
                    onClick={() => fileRef.current?.click()}
                >
                    <svg
                        width="20" height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                </button>
                <input
                    ref={fileRef}
                    type="file"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                />

                <div className={styles.textareaWrap}>
                    <textarea
                        ref={inputRef}
                        className={styles.textarea}
                        placeholder={`Message ${activeContact.username}...`}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        style={{
                            height:
                                Math.min(
                                    120,
                                    Math.max(44, input.split("\n").length * 22 + 22)
                                ) + "px",
                        }}
                    />
                </div>

                <button
                    className={`${styles.sendBtn} ${input.trim() ? styles.sendActive : ""
                        }`}
                    onClick={handleSend}
                    disabled={!input.trim()}
                >
                    <svg
                        width="18" height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                    >
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                </button>
            </div>
        </div>
    );
}