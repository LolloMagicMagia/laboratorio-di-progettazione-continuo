"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserId } from "@/lib/DataService";
import API from "@/lib/api";

/**
 * NewChatPage Component - Displays the interface for creating a new chat.
 *
 * This component:
 * - Retrieves the list of friends from the API
 * - Allows the user to select participants for a new chat
 * - Supports the creation of individual and group chats
 * - Handles form submission to create the chat
 * - Displays error messages if there are any issues during the chat creation process
 *
 * @module frontend/page/src/app/new-chat/page.jsx
 * @returns {JSX.Element} The rendered new chat creation page.
 */
export default function NewChatPage() {
    /**
     * The state holding the list of friends.
     * @type {Array<Object>}
     */
    const [friends, setFriends] = useState([]);

    /**
     * The state holding the list of selected users for creating a chat.
     * @type {Array<Object>}
     */
    const [selectedUsers, setSelectedUsers] = useState([]);

    /**
     * The state holding the type of the chat (e.g., 'individual' or 'group').
     * @type {string}
     */
    const [chatType, setChatType] = useState("individual");

    /**
     * The loading state for fetching data or performing an action.
     * @type {boolean}
     */
    const [loading, setLoading] = useState(true);

    /**
     * The state indicating if the chat creation process is ongoing.
     * @type {boolean}
     */
    const [creating, setCreating] = useState(false);

    /**
     * The error message if any occurs during the creation or fetching process.
     * @type {string|null}
     */
    const [error, setError] = useState(null);

    /**
     * The state holding the initial message to be sent when the chat is created.
     * @type {string}
     */
    const [initialMessage, setInitialMessage] = useState(""); // Nuovo stato per il messaggio iniziale


    const [showAddFriendModal, setShowAddFriendModal] = useState(false);
    const [searchUserId, setSearchUserId] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [friendRequestMessage, setFriendRequestMessage] = useState("");

    const [friendRequests, setFriendRequests] = useState([]);
    const [handlingRequestId, setHandlingRequestId] = useState(null);

    const router = useRouter();

    /**
     * Loads the list of friends when the component mounts.
     * Handles loading state and error state.
     * @function useEffect
     * @async
     * @returns {void}
     */
    useEffect(() => {
        const fetchData = async () => {
            try {
                const friendsList = await API.getFriendsList();
                const requests = await API.getFriendRequestsList();
                setFriends(friendsList);
                setFriendRequests(requests);
                setLoading(false);
            } catch (err) {
                console.error("Errore nel caricamento:", err);
                setError("Si è verificato un errore nel caricamento. Riprova più tardi.");
                setLoading(false);
            }
        };
        fetchData();
    }, []);


    const activeFriends = friends.filter(friend => friend.friendshipStatus === "active");

    /**
     * Toggles the selection of a user for chat creation.
     * Adds the user to the selection if they are not already selected,
     * or removes them if they are. For individual chats, only one user can be selected at a time.
     * @function handleUserToggle
     * @param {string} userId - The ID of the user to toggle in the selection.
     * @returns {void}
     */
    const handleUserToggle = (userId) => {
        setSelectedUsers(prevSelected => {
            if (prevSelected.includes(userId)) {
                return prevSelected.filter(id => id !== userId);
            } else {
                if (chatType === "individual" && prevSelected.length === 1) {
                    return [userId];
                }
                return [...prevSelected, userId];
            }
        });
    };

    /**
     * Handles the click event for creating a new chat.
     * Validates that at least one user is selected and that an initial message is provided.
     * If the validation passes, it proceeds to create the chat by calling `handleCreateChat`.
     *
     * @async
     * @function handleButtonCreateChat
     * @returns {void}
     */
    const handleButtonCreateChat = async () => {
        setError(null);
        if (selectedUsers.length === 0) {
            setError("Seleziona almeno un amico per la chat.");
            return;
        }
        if (!initialMessage.trim()) {
            setError("Devi scrivere un messaggio per creare la chat.");
            return;
        } else {
            handleCreateChat();
        }
    };

    /**
     * Handles the process of creating a new chat.
     * This function first checks the chat type (individual or group) and performs the corresponding creation process.
     * For an individual chat, it checks if the user is already a friend, and if not, it shows an error.
     * If the chat already exists, it shows an error message.
     * If the chat is successfully created, it navigates to the newly created chat.
     *
     * @async
     * @function handleCreateChat
     * @returns {void}
     */
    const handleCreateChat = async () => {
        setError(null);
        try {
            setCreating(true);
            if (chatType === "individual") {
                const friendId = selectedUsers[0];
                if (friends.some(friend => friend.id === friendId)) {
                    const result = await API.createIndividualChatIfNotExists(friendId, initialMessage);
                    if (result.alreadyExists) {
                        setError("Esiste già una chat con questo utente.");
                        setTimeout(() => setError(null), 3000);
                        setCreating(false);
                        return;
                    }
                    router.push("../");
                } else {
                    setError("Non sei ancora amico con questo utente.");
                    setTimeout(() => setError(null), 3000);
                    setCreating(false);
                }
                return;
            }
        } catch (err) {
            console.error("Errore nella creazione della chat:", err);
            setError("Errore nella creazione della chat. Riprova più tardi.");
            setCreating(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "active": return "bg-green-500";
            case "pending": return "bg-yellow-500";
            case "blocked": return "bg-red-500";
            default: return "bg-gray-500";
        }
    };

    const handleSearchUser = async () => {
        try {
            const result = await API.getUserById(searchUserId);
            setSearchResult(result);
            setFriendRequestMessage("");
        } catch (error) {
            console.error("Errore nella ricerca utente:", error);
            setFriendRequestMessage("Utente non trovato");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl font-semibold">Caricamento...</div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="container mx-auto flex items-center" style={{
                    display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem"
                }}>
                    <button onClick={() => router.push("/")} className="btn btn-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold ml-3">Nuova chat</h1>
                </div>
            </header>

            <main className="page-content">
                <div className="card">
                    <div className="card-header">
                        <h2 className="profile-actions">Tipo di chat</h2>
                        <div className="profile-actions">
                            <button onClick={() => {
                                setChatType("individual");
                                if (selectedUsers.length > 1) setSelectedUsers([selectedUsers[0]]);
                            }} className={`btn ${chatType === "individual" ? "btn-primary" : "btn-secondary"}`}>
                                Individuale
                            </button>
                            <button onClick={() => setChatType("group")} className={`btn ${chatType === "group" ? "btn-primary" : "btn-secondary"}`}>
                                Gruppo
                            </button>
                        </div>
                    </div>

                    {chatType === "individual" && selectedUsers.length === 1 && (
                        <div className="card-content border-b">
                            <div className="form-group">
                                <label htmlFor="initialMessage" className="form-label">Messaggio iniziale</label>
                                <input
                                    type="text"
                                    id="initialMessage"
                                    value={initialMessage}
                                    onChange={(e) => setInitialMessage(e.target.value)}
                                    placeholder="Scrivi il primo messaggio..."
                                    className="form-input"
                                />
                            </div>
                        </div>
                    )}

                    <div className="card-content">
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }} className="profile-actions">
                            <h2 className="text-lg font-semibold">I tuoi amici</h2>
                            <button
                                onClick={() => setShowAddFriendModal(true)}
                                style={{
                                    backgroundColor: "white",
                                    color: "#3a0912",
                                    border: "3px solid #990033",
                                    padding: "10px 10px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    display: "flex",
                                    fontWeight: "bold"
                                }}
                            >
                                Aggiungi
                            </button>
                        </div>

                        {/* Richieste di amicizia ricevute */}
                        {friendRequests.length > 0 && (
                            <div className="mb-6">
                                <h3>Richieste di amicizia ricevute:</h3>
                                {friendRequests.map((user) => (
                                    <div key={user.id}>
                                        <div style={{ position: "relative"}}>
                                            <img
                                                src={user.avatar || "https://dummyimage.com/40x40/000/fff&text=P"}
                                                alt={user.username}
                                                className="chat-avatar-image"
                                                style={{ width: "40px", height: "40px" }}
                                            />
                                            <span>{user.username || user.name}</span>
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    padding: "auto",
                                                    height: "12px",
                                                    width: "12px",
                                                    backgroundColor: "#22c55e", // green-500
                                                    borderRadius: "50%",
                                                    border: "2px solid white",
                                                    animation: "pulse 1.5s infinite",
                                                }}
                                            ></span>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={async () => {
                                                    setHandlingRequestId(user.id);
                                                    try {
                                                        await API.acceptFriendRequest(user.id);
                                                        const updatedRequests = friendRequests.filter(req => req.id !== user.id);
                                                        setFriendRequests(updatedRequests);
                                                        setFriends(prev => [...prev, { ...user, friendshipStatus: "active" }]);
                                                    } catch (err) {
                                                        console.error("Errore nell'accettazione:", err);
                                                    } finally {
                                                        setHandlingRequestId(null);
                                                    }
                                                }}
                                                className="btn btn-success"
                                                disabled={handlingRequestId === user.id}
                                            >
                                                ✔ Accetta
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    setHandlingRequestId(user.id);
                                                    try {
                                                        await API.rejectFriendRequest(user.id);
                                                        const updatedRequests = friendRequests.filter(req => req.id !== user.id);
                                                        setFriendRequests(updatedRequests);
                                                    } catch (err) {
                                                        console.error("Errore nel rifiuto:", err);
                                                    } finally {
                                                        setHandlingRequestId(null);
                                                    }
                                                }}
                                                className="btn btn-danger"
                                                disabled={handlingRequestId === user.id}
                                            >
                                                ✖ Rifiuta
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                {error}
                            </div>
                        )}
                        <h3>I tuoi amici:</h3>
                        {/* Lista amici attivi */}
                        <div className="user-list">
                            {activeFriends.length === 0 ? (
                                <div className="py-4 text-center text-gray-500">
                                    Non hai ancora amici
                                </div>
                            ) : (
                                activeFriends.map(user => (
                                    <div key={user.id} className="user-list-item">
                                        <input
                                            type="checkbox"
                                            id={`user-${user.id}`}
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => handleUserToggle(user.id)}
                                            className="h-5 w-5 text-blue-600"
                                            disabled={chatType === "individual" && selectedUsers.length === 1 && !selectedUsers.includes(user.id)}
                                        />
                                        <label htmlFor={`user-${user.id}`} className="ml-3 flex items-center cursor-pointer flex-1">
                                            <img
                                                src={user.avatar || "https://dummyimage.com/40x40/000/fff&text=P"}
                                                alt={user.username || user.name}
                                                className="user-avatar"
                                                style={{ width: "40px", height: "40px" }}
                                            />
                                            <div className="user-info">
                                                <p className="user-name">{user.username || user.name}</p>
                                                <div className="flex items-center">
                                                    <span className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(user.friendshipStatus)}`}></span>
                                                    <span className="capitalize text-sm text-gray-500">Amico</span>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="card-footer flex justify-end profile-actions">
                        <button onClick={() => router.push("/")} className="btn btn-secondary mr-2">
                            Annulla
                        </button>
                        <button onClick={handleButtonCreateChat} className="btn btn-primary">
                            {creating ? "Creazione in corso..." : "Crea Chat"}
                        </button>
                    </div>
                </div>
            </main>

            {showAddFriendModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <div style={{
                        backgroundColor: "white",
                        padding: "2rem",
                        borderRadius: "8px",
                        width: "90%", maxWidth: "400px",
                        boxShadow: "0 0 10px rgba(0,0,0,0.3)"
                    }}>
                        <h3 className="font-boldy3">Aggiungi un amico</h3>
                        <input
                            type="text"
                            value={searchUserId}
                            onChange={(e) => setSearchUserId(e.target.value)}
                            placeholder="Inserisci l'ID utente"
                            className="form-input mb-2 w-full"
                        />
                        <button
                            onClick={handleSearchUser}
                            className="btn2 btn-primary w-full mb-3"
                        >
                            Cerca utente
                        </button>

                        {searchResult && (
                            <div className="p-3 border rounded mb-2">
                                <p className="font-semibold">{searchResult.username || searchResult.name}</p>
                                <p className="text-sm text-gray-600">{searchResult.email}</p>
                                <button
                                    onClick={async () => {
                                        try {
                                            await API.sendFriendRequest(searchResult.id);
                                            setFriendRequestMessage("Richiesta inviata con successo!");
                                            setSearchResult(null);
                                            setSearchUserId("");
                                        } catch (error) {
                                            console.error("Errore nell'invio della richiesta:", error);
                                            setFriendRequestMessage("Errore nell'invio della richiesta.");
                                        }
                                    }}
                                    className="btn btn-primary mt-2"
                                >
                                    Invia richiesta di amicizia
                                </button>
                            </div>
                        )}

                        {friendRequestMessage && (
                            <div className="text-center text-sm text-red-500 mt-2">
                                {friendRequestMessage}
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setShowAddFriendModal(false);
                                setSearchResult(null);
                                setSearchUserId("");
                                setFriendRequestMessage("");
                            }}
                            className="btn btn-secondary mt-4 w-full"
                        >
                            Chiudi
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}