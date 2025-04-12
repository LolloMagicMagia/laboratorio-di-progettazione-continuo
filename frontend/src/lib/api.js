import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const API_BASE = "http://localhost:8080";

const data = {
    users: {}  // ← questa verrà aggiornata dopo una fetch o WebSocket
};


const API = {
    // 👤 Recupera l'utente corrente da localStorage
    getCurrentUser: async () => {
        const currentUserId = localStorage.getItem("currentUserId");
        if (!currentUserId || !data.users[currentUserId]) return null;

        const userData = data.users[currentUserId].user;

        return {
            id: currentUserId,
            ...userData
        };
    },

// 📦 Recupera SOLO l'utente corrente
    fetchUsers: async () => {
        const currentUserId = localStorage.getItem("currentUserId");
        const res = await fetch(`${API_BASE}/api/users/${currentUserId}`);
        const user = await res.json();

        // ✅ Costruisci la mappa utenti con una sola entry
        const usersMap = {
            [currentUserId]: user
        };

        data.users = usersMap;
        console.log("✅ Utente ricevuto:", data.users);

        return usersMap;
    },

    // ✅ Segna una chat come letta
    markChatAsRead: async (chatId) => {
        const currentUserId = localStorage.getItem("currentUserId");
        if (!currentUserId) throw new Error("Utente non autenticato");

        try {
            await fetch(`${API_BASE}/api/users/markChatAsRead/${chatId}`, {
                method: "PUT",
            });
        } catch (err) {
            console.error("Errore nel marcare la chat come letta:", err);
        }
    },

    // 🔌 Crea client WebSocket
    createWebSocketClient: (onUsersUpdate, onMessagesUpdate) => {
        const socket = new SockJS(`${API_BASE}/ws`);
        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            debug: () => {},
        });

        client.onConnect = () => {
            console.log("✅ WebSocket connesso!");

            // Sottoscrizione per gli utenti (già esistente)
            client.subscribe("/topic/users", (message) => {
                console.log("📩 Ricevuto messaggio WebSocket (Utenti):", message.body);

                let usersData = JSON.parse(message.body);

                if (Array.isArray(usersData)) {
                    usersData = Object.fromEntries(usersData.map((u) => [u.id, u]));
                }

                // 🔥 Aggiorna data.users
                data.users = usersData;

                // ✅ Chiama il callback passando la mappa aggiornata degli utenti
                onUsersUpdate(usersData);
            });

            // Sottoscrizione per i messaggi
            client.subscribe("/topic/chats", (message) => {
                console.log("📩 Ricevuto messaggio WebSocket (Messaggi):", message.body);

                let messagesData = JSON.parse(message.body);

                if (Array.isArray(messagesData)) {
                    messagesData = messagesData.map((msg) => ({
                        content: msg.content,
                        read: msg.read,
                        sender: msg.sender,
                        timestamp: msg.timestamp,
                    }));
                }

                // 🔥 Chiama il callback passando i messaggi aggiornati
                onMessagesUpdate(messagesData);
            });
        };

        return client;
    },

    // 🔁 Altri metodi (presumo tu li abbia già implementati altrove)
    getChatById: (chatId) => {
        return fetch(`${API_BASE}/api/chats/${chatId}`).then((res) => res.json());
    },

    getMessagesByChatId: (chatId) => {
        return fetch(`${API_BASE}/api/messages/${chatId}`).then((res) => res.json());
    },

    getUserById: (userId) => {
        return fetch(`${API_BASE}/api/users/${userId}`).then((res) => res.json());
    },

    sendMessage: (chatId, content, sender) => {
        return fetch(`${API_BASE}/api/messages/${chatId}/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content, sender }),
        });
    },


/*
    getFriendsList: () => {
        return fetch(`${API_BASE}/api/friends`).then((res) => res.json());
    },

    createIndividualChatIfNotExists: (friendId, message) => {
        return fetch(`${API_BASE}/api/chat/individual`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ friendId, message }),
        });
    },*/
};

export default API;
