import styles from "./WelcomeScreen.module.css";

export default function WelcomeScreen({ user }) {
    return (
        <div className={styles.wrap}>
            <div className={styles.glow} />
            <div className={styles.content}>
                <div className={styles.iconWrap}>
                    <svg width="52" height="52" viewBox="0 0 28 28" fill="none">
                        <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" fill="url(#wsGrad)" />
                        <path d="M9 14L13 18L19 10" stroke="white" strokeWidth="2.2"
                            strokeLinecap="round" strokeLinejoin="round" />
                        <defs>
                            <linearGradient id="wsGrad" x1="2" y1="2" x2="26" y2="26"
                                gradientUnits="userSpaceOnUse">
                                <stop stopColor="#ff857a" />
                                <stop offset="1" stopColor="#ebaee6" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <h2 className={styles.title}>Welcome, {user?.username} 👋</h2>
                <p className={styles.sub}>
                    Search for someone to start a conversation,
                    or pick a contact from the sidebar.
                </p>
                <div className={styles.features}>
                    {[
                        { icon: "⚡", label: "Real-time messaging" },
                        { icon: "😊", label: "Emoji reactions" },
                        { icon: "📁", label: "File sharing" },
                        { icon: "🔔", label: "Notifications" },
                    ].map((f) => (
                        <div key={f.label} className={styles.feature}>
                            <span className={styles.featureIcon}>{f.icon}</span>
                            <span className={styles.featureLabel}>{f.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}