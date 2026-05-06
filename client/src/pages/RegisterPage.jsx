import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import styles from "./Auth.module.css";

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        confirm: "",
    });
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.username || !form.email || !form.password)
            return toast.error("All fields required");
        if (form.password.length < 6)
            return toast.error("Password must be at least 6 characters");
        if (form.password !== form.confirm)
            return toast.error("Passwords do not match");
        setLoading(true);
        try {
            await register(form.username, form.email, form.password);
            toast.success("Account created! Let's chat 🚀");
            navigate("/chat");
        } catch (err) {
            toast.error(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authBg}>
            <div className={styles.blob1} />
            <div className={styles.blob2} />
            <div className={styles.blob3} />

            <div className={styles.card}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <path
                                d="M14 2L26 8V20L14 26L2 20V8L14 2Z"
                                fill="url(#lg2)"
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
                                    id="lg2"
                                    x1="2" y1="2" x2="26" y2="26"
                                    gradientUnits="userSpaceOnUse"
                                >
                                    <stop stopColor="#8b5cf6" />
                                    <stop offset="1" stopColor="#06b6d4" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span className={styles.logoText}>NovaChat</span>
                </div>

                <h1 className={styles.title}>Create account</h1>
                <p className={styles.subtitle}>Join the conversation</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label className={styles.label}>Username</label>
                        <div className={styles.inputWrap}>
                            <svg
                                className={styles.inputIcon}
                                width="16" height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <input
                                className={styles.input}
                                type="text"
                                placeholder="cooluser123"
                                value={form.username}
                                onChange={(e) =>
                                    setForm({ ...form, username: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Email</label>
                        <div className={styles.inputWrap}>
                            <svg
                                className={styles.inputIcon}
                                width="16" height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                            <input
                                className={styles.input}
                                type="email"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Password</label>
                        <div className={styles.inputWrap}>
                            <svg
                                className={styles.inputIcon}
                                width="16" height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <input
                                className={styles.input}
                                type={showPass ? "text" : "password"}
                                placeholder="Min. 6 characters"
                                value={form.password}
                                onChange={(e) =>
                                    setForm({ ...form, password: e.target.value })
                                }
                            />
                            <button
                                type="button"
                                className={styles.eyeBtn}
                                onClick={() => setShowPass(!showPass)}
                            >
                                {showPass ? "🙈" : "👁️"}
                            </button>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Confirm Password</label>
                        <div className={styles.inputWrap}>
                            <svg
                                className={styles.inputIcon}
                                width="16" height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <input
                                className={styles.input}
                                type={showPass ? "text" : "password"}
                                placeholder="Repeat password"
                                value={form.confirm}
                                onChange={(e) =>
                                    setForm({ ...form, confirm: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <button
                        className={styles.submitBtn}
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className={styles.spinner} />
                        ) : (
                            "Create Account"
                        )}
                    </button>
                </form>

                <p className={styles.switchText}>
                    Already have an account?{" "}
                    <Link to="/login" className={styles.switchLink}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}