import styles from "./Avatar.module.css";

const COLORS = [
    ["#8b5cf6", "#6d28d9"],
    ["#06b6d4", "#0891b2"],
    ["#ec4899", "#db2777"],
    ["#10b981", "#059669"],
    ["#f59e0b", "#d97706"],
    ["#ef4444", "#dc2626"],
    ["#3b82f6", "#2563eb"],
    ["#a855f7", "#9333ea"],
];

function getColor(name = "") {
    const idx = name.charCodeAt(0) % COLORS.length;
    return COLORS[idx];
}

export default function Avatar({
    username = "?",
    avatar,
    size = 40,
    online = false,
}) {
    const [c1, c2] = getColor(username);
    const initial = username.charAt(0).toUpperCase();
    const fontSize = Math.max(12, Math.round(size * 0.38));

    return (
        <div
            className={styles.wrap}
            style={{ width: size, height: size, flexShrink: 0 }}
        >
            {avatar ? (
                <img
                    src={avatar}
                    alt={username}
                    className={styles.img}
                />
            ) : (
                <div
                    className={styles.initials}
                    style={{
                        background: `linear-gradient(135deg, ${c1}, ${c2})`,
                        fontSize,
                    }}
                >
                    {initial}
                </div>
            )}
            {online && <span className={styles.onlineDot} />}
        </div>
    );
}