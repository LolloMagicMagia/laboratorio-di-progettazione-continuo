package com.example.bicoChat_backend.service;

import com.example.bicoChat_backend.dto.response.MessageResponse;
import com.example.bicoChat_backend.model.Message;
import com.google.firebase.database.GenericTypeIndicator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
public class MessageService {

    @Autowired
    private ChatService chatService;

    @Autowired
    private FirebaseService firebaseService;

    public CompletableFuture<List<MessageResponse>> getMessages(String chatId) {
        return chatService.getMessagesMap(chatId)
                .thenApply(messagesMap -> {
                    List<MessageResponse> messageResponseList = new ArrayList<>();
                    if (messagesMap != null) {
                        for (Map.Entry<String, Message> entry : messagesMap.entrySet()) {
                            messageResponseList.add(new MessageResponse(entry.getKey(), entry.getValue()));
                        }
                        messageResponseList.sort(Comparator.comparing(mr -> mr.getMessage().getTimestamp()));
                    }
                    return messageResponseList;
                });
    }

    public CompletableFuture<MessageResponse> addMessage(String chatId, String sender, String content) {
        Message message = new Message();
        message.setSender(sender);
        message.setContent(content);
        message.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        message.setRead("currentUser".equals(sender));

        return chatService.addMessage(chatId, message)
                .thenApply(entry -> new MessageResponse(entry.getKey(), entry.getValue()));
    }

    public CompletableFuture<Void> markChatMessagesAsRead(String chatId, String userId) {
        return chatService.markChatAsRead(chatId, userId);
    }//

    public CompletableFuture<List<Message>> getMessagesByChatId(String chatId) {
        return chatService.getMessagesMap(chatId)
                .thenApply(messagesMap -> {
                    if (messagesMap == null) return Collections.emptyList();

                    return messagesMap.entrySet().stream()
                            .map(entry -> {
                                Message message = entry.getValue();
                                message.setId(entry.getKey()); // 👈 imposta l'ID sul messaggio
                                return message;
                            })
                            .sorted(Comparator.comparing(Message::getTimestamp))
                            .collect(Collectors.toList());
                });
    }

    public CompletableFuture<Map<String, Object>> sendMessage(String chatId, Message message) {
        String messageId = "msg" + System.currentTimeMillis();
        String timestamp = message.getTimestamp();
        String content = message.getContent();
        String sender = message.getSender();

        // 1. Salva il messaggio nella chat
        CompletableFuture<Void> saveMessageFuture =
                firebaseService.set("chats/" + chatId + "/messages/" + messageId, message);

        // 2. Recupera i partecipanti
        GenericTypeIndicator<List<String>> typeIndicator = new GenericTypeIndicator<>() {};
        CompletableFuture<List<String>> participantsFuture =
                firebaseService.getWithTypeIndicator("chats/" + chatId + "/participants", typeIndicator);

        // 3. Recupera tutti gli utenti (per prendere i nomi)
        CompletableFuture<Map<String, Map<String, Object>>> usersFuture =
                firebaseService.getWithTypeIndicator("users", new GenericTypeIndicator<>() {});

        return CompletableFuture.allOf(saveMessageFuture, participantsFuture, usersFuture)
                .thenCompose(v -> {
                    List<String> participants = participantsFuture.join();
                    Map<String, Map<String, Object>> usersMap = usersFuture.join();

                    List<CompletableFuture<Void>> updates = new ArrayList<>();

                    for (String uid : participants) {
                        if (uid == null || uid.isBlank()) continue;

                        String userChatPath = String.format("users/%s/chatUser/%s", uid, chatId);
                        String unreadCountPath = String.format("users/%s/chatUser/%s/unreadCount", uid, chatId);

                        // Trova il nome dell'altro partecipante (se non è gruppo)
                        String name = "Chat";
                        if (participants.size() == 2) {
                            String otherId = participants.stream().filter(p -> !p.equals(uid)).findFirst().orElse(null);
                            if (otherId != null && usersMap.containsKey(otherId)) {
                                name = (String) usersMap.get(otherId).get("username");
                            }
                        }

                        Map<String, Object> chatUserUpdate = new HashMap<>();
                        chatUserUpdate.put("name", name);
                        chatUserUpdate.put("lastMessage", content);
                        chatUserUpdate.put("lastUser", sender);
                        chatUserUpdate.put("timestamp", timestamp);

                        // Recupera unreadCount attuale e incrementa
                        CompletableFuture<Void> updateFuture = firebaseService.get(unreadCountPath, Long.class)
                                .thenCompose(currentUnread -> {
                                    long newCount = (currentUnread != null) ? currentUnread + 1 : 1;
                                    chatUserUpdate.put("unreadCount", newCount);
                                    return firebaseService.update(userChatPath, chatUserUpdate);
                                });

                        updates.add(updateFuture);
                    }

                    return CompletableFuture.allOf(updates.toArray(new CompletableFuture[0]))
                            .thenApply(done -> Map.of(
                                    "id", messageId,
                                    "chatId", chatId,
                                    "content", content,
                                    "sender", sender,
                                    "timestamp", timestamp
                            ));
                });
    }

}
