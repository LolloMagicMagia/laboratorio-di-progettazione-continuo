package com.example.bicoChat_backend.service;

import com.example.bicoChat_backend.dto.response.UserResponse;
import com.example.bicoChat_backend.model.User;
import com.google.firebase.database.GenericTypeIndicator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
public class UserService {

    private static final String USERS_PATH = "users";

    @Autowired
    private FirebaseService firebaseService;

    public CompletableFuture<Optional<UserResponse>> getUserById(String userId) {
        return firebaseService.get(USERS_PATH + "/" + userId, User.class)
                .thenApply(user -> {
                    if (user != null) {
                        return Optional.of(new UserResponse(userId, user));
                    }
                    return Optional.empty();
                });
    }

    public CompletableFuture<List<UserResponse>> getAllUsers() {
        GenericTypeIndicator<Map<String, User>> typeIndicator = new GenericTypeIndicator<Map<String, User>>() {};

        return firebaseService.getWithTypeIndicator(USERS_PATH, typeIndicator)
                .thenApply(usersMap -> {
                    List<UserResponse> userResponses = new ArrayList<>();
                    if (usersMap != null) {
                        for (Map.Entry<String, User> entry : usersMap.entrySet()) {
                            String userId = entry.getKey();
                            User user = entry.getValue();
                            userResponses.add(new UserResponse(userId, user));
                        }
                    }
                    return userResponses;
                });
    }

    public CompletableFuture<UserResponse> getCurrentUser() {
        return getUserById("currentUser").thenCompose(userOpt -> {
            if (userOpt.isPresent()) {
                UserResponse userResponse = userOpt.get();
                return getUserChats(userResponse.getId()).thenApply(chats -> {
                    userResponse.getUser().setChatUser(chats);
                    return userResponse;
                });
            }

            // Se l'utente non esiste, restituiamo un utente di default con una chat di benvenuto
            Map<String, User.ChatInfo> defaultChats = new HashMap<>();
            defaultChats.put("welcome", new User.ChatInfo(
                    "Welcome on BicoChat!",
                    "System",
                    LocalDateTime.now().toString(),
                    0,
                    "system" // lastUser
            ));
            return CompletableFuture.completedFuture(new UserResponse("currentUser", new User("You", "online", defaultChats)));
        });
    }


    public CompletableFuture<Void> updateUserStatus(String userId, String status) {
        Map<String, Object> updates = new HashMap<>();
        updates.put("status", status);
        return firebaseService.update(USERS_PATH + "/" + userId, updates);
    }

    public CompletableFuture<Void> addUser(String userId, User user) {
        return firebaseService.set(USERS_PATH + "/" + userId, user);
    }

    public CompletableFuture<Void> deleteUser(String userId) {
        return firebaseService.delete(USERS_PATH + "/" + userId);
    }

    public CompletableFuture<Map<String, User.ChatInfo>> getUserChats(String userId) {
        return firebaseService.getWithTypeIndicator(USERS_PATH + "/" + userId + "/chatUser", new GenericTypeIndicator<Map<String, User.ChatInfo>>() {})
                .thenApply(chats -> chats != null ? chats : new HashMap<>());
    }

    public CompletableFuture<Void> markChatAsRead(String chatId) {
        // Recupera i partecipanti alla chat
        return firebaseService.getWithTypeIndicator("chats/" + chatId + "/participants", new GenericTypeIndicator<List<String>>() {})
                .thenCompose(participants -> {
                    System.out.println("Partecipanti per la chat " + chatId + ": " + participants);
                    if (participants == null || participants.isEmpty()) {
                        throw new RuntimeException("Nessun partecipante trovato per la chat " + chatId);
                    }

                    // Crea gli aggiornamenti per tutti i partecipanti (set unreadCount a 0)
                    Map<String, Object> updates = new HashMap<>();
                    for (String participantId : participants) {
                        String participantPath = USERS_PATH + "/" + participantId + "/chatUser/" + chatId + "/unreadCount";
                        updates.put(participantPath, 0);  // Imposta unreadCount a 0 per tutti i partecipanti
                    }

                    // Modifica anche i messaggi della chat, settando "read" a true
                    return firebaseService.getWithTypeIndicator("chats/" + chatId + "/messages", new GenericTypeIndicator<Map<String, Map<String, Object>>>() {})
                            .thenCompose(messages -> {
                                Map<String, Object> messagesUpdates = new HashMap<>();
                                if (messages != null) {
                                    messages.forEach((messageId, messageData) -> {
                                        if (messageData != null && !Boolean.TRUE.equals(messageData.get("read"))) {
                                            messagesUpdates.put("chats/" + chatId + "/messages/" + messageId + "/read", true);
                                        }
                                    });
                                }
                                updates.putAll(messagesUpdates);  // Aggiungi gli aggiornamenti sui messaggi

                                // Applicare tutti gli aggiornamenti in un'unica operazione
                                return firebaseService.updateMulti(updates);
                            });
                });
    }




}