"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserId } from "@/lib/DataService";
import API from "@/lib/api";

export default function NewChatPage() {
  const [friends, setFriends] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [chatType, setChatType] = useState("individual");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [initialMessage, setInitialMessage] = useState("");

  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [searchUserId, setSearchUserId] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [friendRequestMessage, setFriendRequestMessage] = useState("");

  const [friendRequests, setFriendRequests] = useState([]);
  const [handlingRequestId, setHandlingRequestId] = useState(null);

  const router = useRouter();

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
                    <h3 className="text-md font-semibold mb-2">Richieste di amicizia ricevute</h3>
                    {friendRequests.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-2 border rounded mb-2">
                          <div className="flex items-center space-x-3">
                            <img
                                src={user.avatar || "https://dummyimage.com/40x40/000/fff&text=P"}
                                alt={user.username}
                                className="chat-avatar-image"
                                style={{ width: "40px", height: "40px" }}
                            />
                            <span>{user.username || user.name}</span>
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
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 9999
            }}>
              <div style={{
                backgroundColor: "white",
                padding: "2rem",
                borderRadius: "8px",
                width: "90%", maxWidth: "400px",
                boxShadow: "0 0 10px rgba(0,0,0,0.3)"
              }}>
                <h3 className="text-lg font-bold mb-4">Aggiungi un amico</h3>
                <input
                    type="text"
                    value={searchUserId}
                    onChange={(e) => setSearchUserId(e.target.value)}
                    placeholder="Inserisci l'ID utente"
                    className="form-input mb-2 w-full"
                />
                <button
                    onClick={handleSearchUser}
                    className="btn btn-primary w-full mb-3"
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

