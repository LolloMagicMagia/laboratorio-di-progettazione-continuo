/*"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import API from "@/lib/api";

export default function HomeRealtime() {
    const [chats, setChats] = useState([]);
    const [users, setUsers] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const uid = localStorage.getItem("currentUserId");
        if (!uid) return router.push("/login");

        const loadInitialData = async () => {
            try {
                const data = await API.fetchUsers();
                const usersMap = Array.isArray(data)
                    ? Object.fromEntries(data.map((u) => [u.id, u.user]))
                    : data;

                setUsers(usersMap);
                const userInfo = usersMap[uid];

                if (userInfo) {
                    setCurrentUser({ id: uid, username: userInfo.username });
                    updateChatsFromUsers(usersMap, uid);
                } else {
                    setCurrentUser({ id: uid, username: "Utente sconosciuto" });
                }
                setLoading(false);
            } catch (err) {
                console.error("Errore caricamento utenti:", err);
                setCurrentUser({ id: uid, username: "Errore" });
                setLoading(false);
            }
        };

        const client = API.createWebSocketClient((usersData) => {
            setUsers(usersData);
            updateChatsFromUsers(usersData, uid);
            const userInfo = usersData[uid];
            if (userInfo) {
                setCurrentUser({ id: uid, username: userInfo.username });
            }
        });

        client.activate();
        loadInitialData();

        return () => client.deactivate();
    }, []);

    const updateChatsFromUsers = (users, uid) => {
        const user = users[uid];
        if (!user || !user.chatUser) return;

        const chatMap = Object.entries(user.chatUser).map(([chatId, chatInfo]) => ({
            chatId,
            name: chatInfo.name,
            lastUser: chatInfo.lastUser,
            lastMessage: chatInfo.lastMessage,
            timestamp: chatInfo.timestamp,
            unreadCount: chatInfo.unreadCount,
        }));

        setChats(chatMap);
    };

    const handleChatClick = (chatId, chatName, lastUser, unreadCount) => {
        if (unreadCount > 0 && lastUser !== currentUser.id) {
            API.markChatAsRead(chatId);
        }
        router.push(`/chat/${chatId}?name=${encodeURIComponent(chatName)}`);
    };

    const renderReadStatus = (lastUser, unreadCount) => {
        if (!currentUser) return null;
        if (lastUser === currentUser.id) {
            return <span className="text-green-500 font-bold">{unreadCount > 0 ? "✓" : "✓✓"}</span>;
        }
        if (unreadCount > 0) {
            return <span className="text-red-500 font-bold">{unreadCount > 9 ? "9+" : unreadCount}</span>;
        }
        return null;
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Caricamento realtime...</div>;
    }

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold">BicoChat (Realtime)</h1>
                    {currentUser && (
                        <Link href="/profile" className="flex items-center">
                            <img
                                src="https://dummyimage.com/40x40/000/fff&text=U"
                                alt="Avatar"
                                className="w-8 h-8 rounded-full mr-2"
                            />
                            <span>{currentUser.username}</span>
                        </Link>
                    )}
                </div>
            </header>

            <main className="page-content relative">
                <div className="card relative">
                    <div className="card-header">
                        <h2 className="text-lg font-semibold">Le tue chat</h2>
                    </div>
                    <div>
                        {chats.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">Nessuna chat attiva.</div>
                        ) : (
                            <div className="divide-y">
                                {chats.map((chat) => (
                                    <div
                                        key={chat.chatId}
                                        className={`chat-list-item ${chat.unreadCount > 0 ? "unread" : ""}`}
                                        onClick={() =>
                                            handleChatClick(
                                                chat.chatId,
                                                chat.name,
                                                chat.lastUser,
                                                chat.unreadCount
                                            )
                                        }
                                    >
                                        <div className="chat-avatar">
                                            <img
                                                src="https://dummyimage.com/48x48/000/fff&text=C"
                                                alt={chat.name}
                                                className="chat-avatar-image"
                                            />
                                        </div>
                                        <div className="chat-info">
                                            <div className="chat-header">
                                                <h3 className="chat-name flex items-center">{chat.name}</h3>
                                                <span className="chat-time">{chat.timestamp}</span>
                                            </div>
                                            <div className="flex items-center">
                        <span className="mr-2">
                          {renderReadStatus(chat.lastUser, chat.unreadCount)}
                        </span>
                                                <span className="chat-message-preview">{chat.lastMessage}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded shadow-lg border">
                    <Link
                        href="/new-chat"
                        className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow transition duration-200"
                    >
                        ➕ Crea nuova chat
                    </Link>
                </div>
            </main>
        </div>
    );
}*/