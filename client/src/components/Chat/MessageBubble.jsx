import { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { format } from "date-fns";
import styles from "./MessageBubble.module.css";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

export default function MessageBubble({ msg, showAvatar, isLast }) {
    const { user } = useAuth();
    const { sendReaction, deleteMessage, activeContact } = useChat();

    const isMine =
        msg.sender._id === user._id || msg.sender === user._id;

    const [showActions, setShowActions] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const hideTimeout = useRef(null);

    const handleMouseEnter = () => {
        clearTimeout(hideTimeout.current);
        setShowActions(true);
    };

    const handleMouseLeave = () => {
        hideTimeout.current = setTimeout(() => {
            setShowActions(false);
            setShowEmojiPicker(false);
        }, 300);
    };

    const handleReaction = (emoji) => {
        sendReaction(
            msg._id,
            emoji,
            isMine ? activeContact._id : user._id
        );
        setShowEmojiPicker(false);
        setShowActions(false);
    };

    const handleDelete = () => {
        if (window.confirm("Delete this message?")) {
            deleteMessage(msg._id, activeContact._id);
        }
    };

    const groupedReactions =
        msg.reactions?.reduce((acc, r) => {
            acc[r.emoji] = (acc[r.emoji] || 0) + r.users.length;
            return acc;
        }, {}) || {};

    return (
        <div
            className={`${styles.row} ${isMine ? styles.mine : styles.theirs
                }`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className={styles.bubbleWrap}>

                {/* Action bar */}
                {showActions && !msg.isDeleted && (
                    <div
                        className={`${styles.actions} ${isMine ? styles.actionsLeft : styles.actionsRight
                            }`}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <button
                            className={styles.actionBtn}
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            title="React"
                        >
                            😊
                        </button>

                        {isMine && (
                            <button
                                className={styles.actionBtn}
                                onClick={handleDelete}
                                title="Delete"
                            >
                                <svg
                                    width="13" height="13"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6l-1 14H6L5 6" />
                                    <path d="M10 11v6" />
                                    <path d="M14 11v6" />
                                </svg>
                            </button>
                        )}

                        {/* Quick Emoji Picker */}
                        {showEmojiPicker && (
                            <div
                                className={`${styles.quickEmoji} ${isMine
                                        ? styles.quickEmojiLeft
                                        : styles.quickEmojiRight
                                    }`}
                            >
                                {QUICK_EMOJIS.map((e) => (
                                    <button
                                        key={e}
                                        className={styles.emojiBtn}
                                        onClick={() => handleReaction(e)}
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Bubble */}
                <div
                    className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs
                        } ${msg.isDeleted ? styles.deleted : ""}`}
                >
                    {/* Image */}
                    {msg.type === "image" && msg.fileUrl && (
                        <img
                            src={msg.fileUrl}
                            alt="shared"
                            className={styles.image}
                        />
                    )}

                    {/* File */}
                    {msg.type === "file" && msg.fileUrl && (
                        <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.fileLink}
                        >
                            <svg
                                width="16" height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>
                            {msg.fileName || "Download file"}
                        </a>
                    )}

                    {/* Text */}
                    {msg.content && (
                        <p
                            className={`${styles.text} ${msg.isDeleted ? styles.deletedText : ""
                                }`}
                        >
                            {msg.isDeleted ? (
                                <span className={styles.deletedLabel}>
                                    <svg
                                        width="12" height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    This message was deleted
                                </span>
                            ) : (
                                msg.content
                            )}
                        </p>
                    )}

                    {/* Timestamp - shows on every message */}
                    <div className={styles.meta}>
                        <span className={styles.time}>
                            {format(new Date(msg.createdAt), "hh:mm a")}
                        </span>
                        {isMine && !msg.isDeleted && (
                            <span
                                className={styles.readTick}
                                title={msg.isRead ? "Read" : "Delivered"}
                            >
                                {msg.isRead ? (
                                    <svg
                                        width="14" height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#06b6d4"
                                        strokeWidth="2.5"
                                    >
                                        <polyline points="1 12 5 16 9 12" />
                                        <polyline points="9 12 13 16 23 6" />
                                    </svg>
                                ) : (
                                    <svg
                                        width="14" height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                    >
                                        <polyline points="5 12 10 17 20 7" />
                                    </svg>
                                )}
                            </span>
                        )}
                    </div>
                </div>

                {/* Reactions */}
                {Object.keys(groupedReactions).length > 0 && (
                    <div
                        className={`${styles.reactions} ${isMine ? styles.reactionsLeft : styles.reactionsRight
                            }`}
                    >
                        {Object.entries(groupedReactions).map(
                            ([emoji, count]) => (
                                <button
                                    key={emoji}
                                    className={styles.reaction}
                                    onClick={() => handleReaction(emoji)}
                                >
                                    {emoji}
                                    {count > 1 && (
                                        <span className={styles.reactionCount}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}