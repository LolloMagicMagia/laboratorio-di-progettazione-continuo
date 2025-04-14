"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import API from "@/lib/api";

/**
 * Homepage - Main route ("/").
 * @module frontend/page/src/app/page.jsx
 * @description Displays the user's chat list and allows navigation to individual chats.
 */

export default function Home() {
  /**
   * Stores the list of chats.
   * @type {Array<Object>}
   */
  const [chats, setChats] = useState([]);

  /**
   * Stores the filtered list of chats based on search.
   * @type {Array<Object>}
   */
  const [filteredChats, setFilteredChats] = useState([]);

  /**
   * Stores the current user's data.
   * @type {Object|null}
   */
  const [currentUser, setCurrentUser] = useState(null);

  /**
   * Tracks whether data is still being loaded.
   * @type {boolean}
   */
  const [loading, setLoading] = useState(true);

  /**
   * Stores any error message encountered during loading or user actions.
   * @type {string|null}
   */
  const [error, setError] = useState(null);

  const [hasFriendRequests, setHasFriendRequests] = useState(false);

  /**
   * Stores the current search query.
   * @type {string}
   */
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();

  /**
   * Fetches the current user and their chat list on component mount.
   * Retrieves chat data and sets application state.
   * @async
   * @function fetchData
   * @returns {Promise<void>}
   */
  useEffect(() => {
    const id = localStorage.getItem("currentUserId");
    if (!id) {
      setError("Utente non autenticato");
      return;
    }
    setCurrentUser(id);

    const fetchData = async () => {
      try {
        await API.fetchUsers(); // 🔁 Prima carico tutti gli utenti
        const user = await API.getCurrentUser();
        const requests = await API.getFriendRequestsList();
        console.log("📬 Sbrend requests:", requests);
        setHasFriendRequests(requests.length > 0);
        if (!user) throw new Error("Utente non trovato");
        setCurrentUser(user);

        const fetchedChats = Object.entries(user.chatUser).map(([chatId, chatData]) => ({
          chatId,
          name: chatData.name,
          lastUser: chatData.lastUser,
          lastMessage: chatData.lastMessage,
          timestamp: chatData.timestamp,
          unreadCount: chatData.unreadCount
        })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setChats(fetchedChats);
        setFilteredChats(fetchedChats);
        setLoading(false);
      } catch (err) {
        console.error("Errore nel caricamento dei dati:", err);
        setError("Errore nel caricamento delle chat.");
        setLoading(false);
      }
    };

    // 👉 Aggiungi il WebSocket client
    const client = API.createWebSocketClient((updatedUsers) => {
      API.getCurrentUser().then((user) => {
        if (!user) return;
        setCurrentUser(user);

        const updatedChats = Object.entries(user.chatUser).map(([chatId, chatData]) => ({
          chatId,
          name: chatData.name,
          lastUser: chatData.lastUser,
          lastMessage: chatData.lastMessage,
          timestamp: chatData.timestamp,
          unreadCount: chatData.unreadCount
        })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setChats(updatedChats);
        setFilteredChats(updatedChats);
      });
    });

    client.activate();
    fetchData();

    return () => client.deactivate();
  }, []);

  /**
   * Handles when a user clicks on a chat.
   * Marks the chat as read if needed and redirects to the chat page.
   * @async
   * @function handleChatClick
   * @param {string} chatId - The ID of the selected chat.
   * @param {string} chatName - The name of the chat.
   * @param {string} lastUser - The ID of the last user who sent a message.
   * @param {number} unreadCount - Number of unread messages.
   * @returns {Promise<void>}
   */
  const handleChatClick = async (chatId, chatName, lastUser, unreadCount) => {
    try {
      if (!currentUser) {
        console.error("Utente non loggato");
        return;
      }

      if (unreadCount > 0 && lastUser !== currentUser.id) {
        try {
          await API.markChatAsRead(chatId);
        } catch (markReadError) {
          console.error("Errore nel marcare la chat come letta:", markReadError);
        }
      }

      router.push(`/chat/${chatId}?name=${encodeURIComponent(chatName)}`);
    } catch (err) {
      console.error("Errore apertura chat:", err);
      setError("Impossibile aprire la chat.");
    }
  };

  /**
   * Handles search query changes and filters the chat list.
   * @param {string} value - Search input string
   */
  const handleSearch = (value) => {
    setSearchQuery(value);
    const filtered = chats.filter(chat =>
        chat.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredChats(filtered);
  };

  /**
   * Renders the visual status of message read/unread indicators.
   * @function renderReadStatus
   * @param {string} lastUser - ID of the last user who sent a message.
   * @param {number} unreadCount - Number of unread messages.
   * @returns {JSX.Element|null}
   */
  const renderReadStatus = (lastUser, unreadCount) => {
    if (!currentUser) return null;

    if (lastUser === currentUser.id) {
      return (
          <span className="font-boldy">
          {unreadCount > 0 ? "✓" : "✓✓"}
        </span>
      );
    }

    if (unreadCount > 0) {
      return (
          <span className="font-boldy2">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      );
    }
    return null;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Caricamento...</div>;
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-red-500 mb-4">{error}</div>
          <button onClick={() => window.location.reload()} className="btn btn-primary">Riprova</button>
        </div>
    );
  }

  return (
      <div className="page-container">
        <header className="page-header">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">BicoChat</h1>
            {currentUser && (
                <Link href="/profile" style={{color: "white"}}>
                  <img
                      src={currentUser.avatar || "https://dummyimage.com/40x40/000/fff&text=U"}
                      alt={currentUser.username}
                      className="user-avatar"
                  />
                  <span>{currentUser.username}</span>
                </Link>
            )}
          </div>
        </header>
        <main className="page-content">
          <h2 className="font-bold" style={{ display: "flex", justifyContent: "center", alignItems: "center", color: "black" }}>Bicoccati Anche Tu!</h2>
          <div className="card" style={{ margin: "0 auto" }}>
            <div className="card-header" style={{ borderBottom: "2px", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <p className="font-bold" style={{ display: "flex", justifyContent: "center", alignItems: "center", color: "black" }}></p>
              <input
                  type="text"
                  placeholder="Cerca tra le tue chat..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="search-card"
              />
            </div>
            <div>
              {filteredChats.length === 0 ? (
                  <div style={{display: "flex", justifyContent: "center", alignItems: "center"}}>Nessuna chat trovata</div>
              ) : (
                  <div className="divide-y">
                    {filteredChats.map(chat => (
                        <div
                            key={chat.chatId}
                            className={`chat-list-item ${chat.unreadCount > 0 ? "unread" : ""}`}
                            onClick={() => handleChatClick(chat.chatId, chat.name, chat.lastUser, chat.unreadCount)}
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
                              <h3 className="chat-name flex items-center">
                                {chat.name}
                              </h3>
                              <span className="chat-time">{formatTimestamp(chat.timestamp)}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="mr-2">{renderReadStatus(chat.lastUser, chat.unreadCount)} </span>
                              <span className="chat-message-preview">{chat.lastMessage}</span>
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </div>
          </div>
          <div style={{ position: "relative"}}>
            <Link href="/new-chat" className="btn-floating">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {hasFriendRequests && (
                  <span
                      style={{
                        position: "absolute",
                        top: "0px",
                        right: "-4px",
                        height: "12px",
                        width: "12px",
                        backgroundColor: "#22c55e", // green-500
                        borderRadius: "50%",
                        border: "2px solid white",
                        animation: "pulse 1.5s infinite",
                        zIndex: 9999
                      }}
                  ></span>
              )}
            </Link>
          </div>

        </main>
        {process.env.NODE_ENV === "development" && (
            <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded shadow-lg border">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inserisci ID utente:
              </label>
              <input
                  type="text"
                  id="userIdInput"
                  className="w-full px-3 py-2 border rounded mb-2 text-sm"
                  placeholder="Inserisci ID utente..."
              />
              <button
                  onClick={() => {
                    const input = document.getElementById("userIdInput");
                    const newId = input instanceof HTMLInputElement ? input.value.trim() : "";

                    if (!newId) {
                      alert("Per favore inserisci un ID utente valido.");
                      return;
                    }

                    localStorage.setItem("currentUserId", newId);
                    router.push("/redirect-back");
                  }}
                  className="w-full bg-yellow-500 text-white px-4 py-2 rounded shadow hover:bg-yellow-600"
              >
                🔄 Cambia utente
              </button>
            </div>
        )}
      </div>
  );
}