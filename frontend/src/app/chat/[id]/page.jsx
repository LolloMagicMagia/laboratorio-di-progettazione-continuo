"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useSearchParams } from "next/navigation";
import API from "@/lib/api";

/**
 * ChatPage Component - Displays a single chat interface.
 *
 *
 * This component:
 * - Retrieves the chat ID from the URL
 * - Loads chat and participant data
 * - Polls for new messages
 * - Allows the user to send new messages
 *
 * @module frontend/page/src/app/chat/id/page.jsx
 * @returns {JSX.Element} The rendered chat page.
 */
export default function ChatPage() {
  /**
   * Parameters extracted from the route using `useParams` hook.
   * @type {Object}
   * @property {string} id - The ID of the current chat, extracted from the URL.
   */
  const params = useParams(); // <-- usa useParams

  /**
   * Search parameters from the URL using `useSearchParams` hook.
   * @type {URLSearchParams}
   */
  const searchParams = useSearchParams();

  /**
   * The title of the chat, either from the search parameters or defaulting to "Chat".
   * @type {string}
   */
  const title = searchParams.get("name") || "Chat";

  /**
   * The ID of the current chat, extracted from the `params` object.
   * @type {string}
   */
  const chatId = params?.id;

  /**
   * The state holding the current chat data.
   * @type {Object|null}
   */
  const [chat, setChat] = useState(null);

  /**
   * The state holding the list of messages in the current chat.
   * @type {Array<Object>}
   */
  const [messages, setMessages] = useState([]);

  /**
   * The ID of the current user.
   * @type {string|null}
   */
  const [currentUserId, setCurrentUserId] = useState(null);

  /**
   * The content of the new message being typed by the user.
   * @type {string}
   */
  const [newMessage, setNewMessage] = useState("");

  /**
   * The loading state for chat and messages.
   * @type {boolean}
   */
  const [loading, setLoading] = useState(true);

  /**
   * The loading state for sending a message.
   * @type {boolean}
   */
  const [sendingMessage, setSendingMessage] = useState(false);

  /**
   * The error message if any occurs during loading or interaction.
   * @type {string|null}
   */
  const [error, setError] = useState(null);

  /**
   * A map of user IDs to their corresponding user data.
   * @type {Object}
   */
  const [usersMap, setUsersMap] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editedText, setEditedText] = useState("");

  /**
   * A reference to the bottom of the messages list, used for auto-scrolling.
   * @type {React.RefObject}
   */
  const messagesEndRef = useRef(null);
  /**
   * Router object for navigating programmatically.
   * @type {Object}
   * @property {function} push - Function to navigate to a new route.
   */
  const router = useRouter();

  const markChatAsReadIfNeeded = () => {
    const lastMsg = messages[messages.length - 1];
    const isLastFromOtherUser = lastMsg && lastMsg.sender !== currentUserId;

    if (
        document.visibilityState === "visible" &&
        document.hasFocus() &&
        chatId &&
        currentUserId &&
        messages.length > 0 &&
        isLastFromOtherUser
    ) {
      console.log("✅ Lettura aggiornata");
      API.markChatAsRead(chatId).catch(console.error);
    }
  };

  /**
   * Loads chat, messages and user data on mount.
   * Also sets up polling every 5 seconds.
   * @function useEffect
   * @async
   * @returns {void}
   */
  useEffect(() => {
    const id = localStorage.getItem("currentUserId");
    if (!id) {
      setError("User not authenticated");
      return;
    }
    setCurrentUserId(id);

    let client = null;

    const fetchData = async () => {
      try {
        const chatData = await API.getChatById(chatId);
        if (!chatData) {
          setError("Chat not found");
          setLoading(false);
          return;
        }
        setChat(chatData);

        const mappedMessages = await API.getMessagesByChatId(chatId);
        setMessages(mappedMessages);

        const userIds = [...new Set(chatData.participants)];
        const users = await Promise.all(userIds.map((uid) => API.getUserById(uid)));
        const map = {};
        users.forEach((u) => (map[u.id] = u));
        setUsersMap(map);

        client = API.createWebSocketClient(
            false,
            (messagesData) => {
              const filteredMessages = messagesData.filter((msg) => msg.chatId === chatId);

              setMessages((prevMessages) => {
                const prevMap = new Map(prevMessages.map((m) => [m.id, m]));
                const newMap = new Map();

                filteredMessages.forEach((msg) => {
                  const prev = prevMap.get(msg.id);
                  newMap.set(msg.id, {
                    ...prev,
                    ...msg,
                    timestamp: prev?.timestamp ?? msg.timestamp, // preserva timestamp originale se esiste
                  });
                });

                return Array.from(newMap.values()).sort(
                    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
                );
              });
            }
        );

        client.activate();
        setLoading(false);
      } catch (err) {
        console.error("Error loading chat data:", err);
        setError("Failed to load chat. Please try again later.");
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (client?.active) {
        console.log("🚩 WebSocket disattivato per chatId:", chatId);
        client.deactivate();
      }
      setMessages([]);
    };
  }, [chatId]);

  useEffect(() => {
    if (sendingMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const handleFocusOrVisibility = () => {
      markChatAsReadIfNeeded();
    };

    window.addEventListener("focus", handleFocusOrVisibility);
    document.addEventListener("visibilitychange", handleFocusOrVisibility);

    markChatAsReadIfNeeded();

    return () => {
      window.removeEventListener("focus", handleFocusOrVisibility);
      document.removeEventListener("visibilitychange", handleFocusOrVisibility);
    };
  }, [messages, chatId, currentUserId]);


  /**
   * Sends a message to the current chat.
   * @function handleSendMessage
   * @async
   * @param {Event} e - The form submission event.
   * @returns {Promise<void>}
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      setSendingMessage(true);
      await API.sendMessage(chatId, newMessage.trim(), currentUserId);
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again later.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleEditMessage = (msg) => {
    setEditingId(msg.id);
    setEditedText(msg.content);
    setOpenMenuId(null);
  };

  const submitEdit = async (e, messageId) => {
    e.preventDefault();
    if (!editedText.trim()) return;

    try {
      await API.updateMessage(chatId, messageId, editedText.trim());
      setEditingId(null);
      setEditedText("");
    } catch (err) {
      console.error("Errore durante la modifica:", err);
    }
  };

  const handleDeleteMessage = async (msg) => {
    if (!msg?.id) {
      console.error("❌ Impossibile eliminare messaggio: id mancante", msg);
      return;
    }

    try {
      console.log("🧪 Cancella messaggio:", msg);
      await API.deleteMessage(chatId, msg.id);
    } catch (err) {
      console.error("Errore durante l'eliminazione:", err);
    } finally {
      setOpenMenuId(null);
    }
  };

  const toggleMenu = (id) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  /**
   * Formats a timestamp string into "HH:mm".
   * @function formatMessageTime
   * @param {string} timestamp
   * @returns {string}
   */
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  /**
   * Groups messages by the date they were sent.
   * @function groupMessagesByDate
   * @returns {Array<{ date: string, messages: Array<Object> }>}
   */
  const groupMessagesByDate = () => {
    const groups = {};
    messages.forEach((message) => {
      const date = new Date(message.timestamp || Date.now()).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(message);
    });
    return Object.entries(groups).map(([date, msgs]) => ({ date, messages: msgs }));
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-xl font-semibold">Loading...</div>;
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-red-500 mb-4">{error}</div>
          <button onClick={() => window.location.reload()} className="btn btn-primary">Try Again</button>
        </div>
    );
  }

  const isGroup = chat.type === "group";
  const otherUser = !isGroup && Array.isArray(chat.participants) && chat.participants.find(pid => pid !== currentUserId);
  const chatAvatar = isGroup
      ? chat.avatar || "https://dummyimage.com/40x40/000/fff&text=G"
      : otherUser && usersMap[otherUser]?.avatar || "https://dummyimage.com/40x40/000/fff&text=U";

  const messageGroups = groupMessagesByDate();

  return (
      <div className="page-container flex flex-col h-screen">
        <header className="page-header">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <button id="back-button" onClick={() => router.back()} className="btn btn-icon p-2 rounded-full hover:bg-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <div className="flex flex-row items-center gap-2">
              <img src={chatAvatar} alt={title} className="user-avatar h-8 w-8" />
              <h1 className="text-xs font-medium text-gray-700">{title}</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="chat-container flex-1 overflow-y-auto">
            <div className="message-list px-4 py-2">
              {messageGroups.map((group, idx) => (
                  <div key={`${group.date}-${idx}`} className="message-group">
                  <div className="message-date">
                      <span className="message-date-text">{group.date}</span>
                    </div>
                    <div className="space-y-3">
                      {group.messages.map((msg, index) => {
                        const isMine = msg.sender === currentUserId;
                        const key = msg.id || `msg-${index}`;
                        const senderName = usersMap[msg.sender]?.username || "User";
                        return (
                            <div key={key} className={`message relative ${isMine ? "message-sent" : "message-received"}`}>
                            {isMine && (
                                  <div className="absolute top-1 right-1 z-10">
                                    <button
                                        onClick={() => toggleMenu(msg.id)}
                                        style={{backgroundColor: "#4338ca", color: "white"}}
                                    >
                                      ⋮
                                    </button>

                                    {openMenuId === msg.id && (
                                        <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-50 text-sm">
                                          <button
                                              onClick={() => handleEditMessage(msg)}
                                              style={{backgroundColor: "#4338ca", color: "white"}}
                                          >
                                            Modifica messaggio
                                          </button>
                                          <button
                                              onClick={() => handleDeleteMessage(msg)}
                                              style={{backgroundColor: "#4338ca", color: "white"}}
                                          >
                                            Elimina messaggio
                                          </button>
                                        </div>
                                    )}
                                  </div>
                              )}

                              {!editingId || editingId !== msg.id ? (
                                  <>
                                    {!isMine && isGroup && (
                                        <p className="text-xs font-bold mb-1">{senderName}</p>
                                    )}
                                    <p>{msg.content}</p>
                                    <p className="message-time">
                                      {formatMessageTime(msg.timestamp)}
                                      {isMine && <span className="ml-1">{msg.read ? "✓✓" : "✓"}</span>}
                                    </p>
                                  </>
                              ) : (
                                  <form onSubmit={(e) => submitEdit(e, msg.id)}>
                                    <input
                                        type="text"
                                        value={editedText}
                                        onChange={(e) => setEditedText(e.target.value)}
                                        className="w-full p-1 text-sm border rounded"
                                        autoFocus
                                    />
                                    <div className="flex gap-2 mt-1">
                                      <button type="submit" style={{backgroundColor: "#4338ca", color: "white"}}>Salva</button>
                                      <button
                                          type="button"
                                          style={{backgroundColor: "#4338ca", color: "white"}}
                                          onClick={() => setEditingId(null)}
                                      >
                                        Annulla
                                      </button>
                                    </div>
                                  </form>
                              )}
                            </div>
                        );
                      })}
                    </div>
                  </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="message-input-container">
            <form onSubmit={handleSendMessage} className="message-input-form">
              <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Write a message..."
                  className="message-input"
                  disabled={sendingMessage}
              />
              <button
                  type="submit"
                  className="message-send-button"
                  disabled={!newMessage.trim() || sendingMessage}
              >
                {sendingMessage ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" className="opacity-75" />
                    </svg>
                ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                )}
              </button>
            </form>
          </div>
        </main>
      </div>
  );
}