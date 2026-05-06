import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import Sidebar from "../components/Chat/Sidebar";
import ChatWindow from "../components/Chat/ChatWindow";
import WelcomeScreen from "../components/Chat/WelcomeScreen";
import styles from "./ChatPage.module.css";

export default function ChatPage() {
    const { user } = useAuth();
    const { activeContact, loadContacts } = useChat();

    useEffect(() => {
        loadContacts();
    }, [loadContacts]);

    return (
        <div className={styles.layout}>
            <Sidebar />
            <main className={styles.main}>
                {activeContact ? (
                    <ChatWindow />
                ) : (
                    <WelcomeScreen user={user} />
                )}
            </main>
        </div>
    );
}