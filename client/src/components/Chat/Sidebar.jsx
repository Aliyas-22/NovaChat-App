import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import api from "../../utils/api";
import Avatar from "../UI/Avatar";
import { formatDistanceToNow } from "date-fns";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
    const { user, logout } = useAuth();
    const {
        contacts,
        activeContact,
        selectContact,
        unreadCounts,
        onlineUsers,
        setContacts,
    } = useChat();
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const searchTimeout = useRef(null);

    const handleSearch = useCallback((q) => {
        setSearch(q);
        clearTimeout(searchTimeout.current);
        if (!q.trim()) {
            setSearchResults([]);
            setSearching(false);
            return;
        }
        setSearching(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const { data } = await api.get(`/users/search?q=${q}`);
                setSearchResults(data.users || []);
            } catch { }
            setSearching(false);
        }, 300);
    }, []);

    const handleSelectSearchResult = async (contact) => {
        setSearch("");
        setSearchResults([]);
        setContacts((prev) => {
            if (prev.find((c) => c._id === contact._id)) return prev;
            return [contact, ...prev];
        });
        await selectContact(contact);
    };

    const displayList = search.trim() ? searchResults : contacts;

    return (
        <aside className={styles.sidebar}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.brand}>
                    <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                        <path
                            d="M14 2L26 8V20L14 26L2 20V8L14 2Z"
                            fill="url(#sbLg)"
                        />
                        <path
                            d="M9 14L13 18L19 10"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <defs>
                            <linearGradient
                                id="sbLg"
                                x1="2" y1="2" x2="26" y2="26"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop stopColor="#8b5cf6" />
                                <stop offset="1" stopColor="#06b6d4" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span className={styles.brandName}>NovaChat</span>
                </div>
                <button
                    className={styles.iconBtn}
                    onClick={logout}
                    title="Logout"
                >
                    <svg
                        width="18" height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                </button>
            </div>

            {/* User profile mini */}
            <div className={styles.userCard}>
                <Avatar
                    username={user?.username}
                    avatar={user?.avatar}
                    size={40}
                    online
                />
                <div className={styles.userInfo}>
                    <span className={styles.userName}>{user?.username}</span>
                    <span className={styles.userStatus}>
                        <span className={styles.onlineDot} />
                        Online
                    </span>
                </div>
            </div>

            {/* Search */}
            <div className={styles.searchWrap}>
                <svg
                    className={styles.searchIcon}
                    width="15" height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                    className={styles.searchInput}
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                />
                {searching && <div className={styles.searchSpinner} />}
            </div>

            {/* Contacts list */}
            <div className={styles.list}>
                {search.trim() &&
                    searchResults.length === 0 &&
                    !searching && (
                        <div className={styles.empty}>No users found</div>
                    )}

                {!search.trim() && contacts.length === 0 && (
                    <div className={styles.empty}>
                        <svg
                            width="40" height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            style={{ opacity: 0.3, marginBottom: 8 }}
                        >
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        Search for users to start chatting
                    </div>
                )}

                {displayList.map((contact) => {
                    const isActive = activeContact?._id === contact._id;
                    const unread = unreadCounts[contact._id] || 0;
                    const isOnline =
                        onlineUsers.has(contact._id) || contact.isOnline;

                    return (
                        <button
                            key={contact._id}
                            className={`${styles.contactItem} ${isActive ? styles.active : ""
                                }`}
                            onClick={() =>
                                search.trim()
                                    ? handleSelectSearchResult(contact)
                                    : selectContact(contact)
                            }
                        >
                            <Avatar
                                username={contact.username}
                                avatar={contact.avatar}
                                size={46}
                                online={isOnline}
                            />
                            <div className={styles.contactInfo}>
                                <div className={styles.contactRow}>
                                    <span className={styles.contactName}>
                                        {contact.username}
                                    </span>
                                    {contact.lastSeen && (
                                        <span className={styles.contactTime}>
                                            {isOnline
                                                ? "now"
                                                : formatDistanceToNow(
                                                    new Date(contact.lastSeen),
                                                    { addSuffix: false }
                                                )}
                                        </span>
                                    )}
                                </div>
                                <div className={styles.contactRow}>
                                    <span className={styles.contactSub}>
                                        {isOnline
                                            ? "Active now"
                                            : contact.bio || contact.email}
                                    </span>
                                    {unread > 0 && (
                                        <span className={styles.badge}>
                                            {unread > 9 ? "9+" : unread}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}