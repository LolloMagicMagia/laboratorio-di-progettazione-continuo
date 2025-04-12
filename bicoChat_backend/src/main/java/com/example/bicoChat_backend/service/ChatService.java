package com.example.bicoChat_backend.service;

import com.example.bicoChat_backend.dto.response.ChatResponse;
import com.example.bicoChat_backend.model.Chat;
import com.example.bicoChat_backend.model.Message;
import com.example.bicoChat_backend.model.User;
import com.google.firebase.database.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
public class ChatService {

    private static final String CHATS_PATH = "chats";
    private static final String USERS_PATH = "users";

    @Autowired
    private FirebaseService firebaseService;

    @Autowired
    private UserService userService;

    public CompletableFuture<List<ChatResponse>> getAllChats() {
        GenericTypeIndicator<Map<String, Chat>> typeIndicator = new GenericTypeIndicator<Map<String, Chat>>() {};

        return firebaseService.getWithTypeIndicator(CHATS_PATH, typeIndicator)
                .thenApply(chatsMap -> {
                    List<ChatResponse> chatResponseList = new ArrayList<>();
                    if (chatsMap != null) {
                        for (Map.Entry<String, Chat> entry : chatsMap.entrySet()) {
                            chatResponseList.add(new ChatResponse(entry.getKey(), entry.getValue()));
                        }
                    } else {
                        System.out.println("No chats found on Firebase!");
                    }
                    return chatResponseList;
                });
    }

    public CompletableFuture<Optional<ChatResponse>> getChatById(String chatId) {
        return firebaseService.get(CHATS_PATH + "/" + chatId, Chat.class)
                .thenApply(chat -> {
                    if (chat != null) {
                        return Optional.of(new ChatResponse(chatId, chat));
                    }
                    return Optional.empty();
                });
    }

    public CompletableFuture<ChatResponse> createChat(Chat chat) {
        String chatId = UUID.randomUUID().toString();

        return firebaseService.set(CHATS_PATH + "/" + chatId, chat)
                .thenApply(v -> {
                    updateChatReferencesInUserProfiles(chatId, chat);
                    return new ChatResponse(chatId, chat);
                });
    }

    private void updateChatReferencesInUserProfiles(String chatId, Chat chat) {
        for (String userId : chat.getParticipants()) {
            userService.getUserById(userId).thenAccept(optionalUser -> {
                optionalUser.ifPresent(userResponse -> {
                    User user = userResponse.getUser();

                    User.ChatInfo chatInfo = new User.ChatInfo(
                            "",
                            chat.getName() != null ? chat.getName() : userId,
                            LocalDateTime.now().toString(),
                            0,
                            "system" // lastUser
                    );

                    Map<String, User.ChatInfo> userChats = user.getChatUser();
                    if (userChats == null) {
                        userChats = new HashMap<>();
                    }
                    userChats.put(chatId, chatInfo);
                    user.setChatUser(userChats);

                    firebaseService.set(USERS_PATH + "/" + userId, user);
                });
            });
        }
    }

    public CompletableFuture<Map.Entry<String, Message>> addMessage(String chatId, Message message) {
        String messageId = UUID.randomUUID().toString();

        return firebaseService.set(CHATS_PATH + "/" + chatId + "/messages/" + messageId, message)
                .thenCompose(v -> updateLastMessageForParticipants(chatId, message))
                .thenApply(v -> new AbstractMap.SimpleEntry<>(messageId, message));
    }

    private CompletableFuture<Void> updateLastMessageForParticipants(String chatId, Message message) {
        return getChatById(chatId).thenCompose(optionalChat -> {
            if (optionalChat.isPresent()) {
                Chat chat = optionalChat.get().getChat();
                List<CompletableFuture<Void>> futures = new ArrayList<>();

                for (String userId : chat.getParticipants()) {
                    CompletableFuture<Void> future = userService.getUserById(userId)
                            .thenCompose(optionalUser -> {
                                if (optionalUser.isPresent()) {
                                    User user = optionalUser.get().getUser();
                                    Map<String, User.ChatInfo> userChats = user.getChatUser();

                                    if (userChats != null && userChats.containsKey(chatId)) {
                                        User.ChatInfo chatInfo = userChats.get(chatId);
                                        chatInfo.setLastMessage(message.getContent());
                                        chatInfo.setTimestamp(message.getTimestamp());
                                        chatInfo.setLastUser(message.getSender());

                                        if (!userId.equals(message.getSender())) {
                                            chatInfo.setUnreadCount(chatInfo.getUnreadCount() + 1);
                                        }

                                        userChats.put(chatId, chatInfo);
                                        user.setChatUser(userChats);

                                        return firebaseService.set(USERS_PATH + "/" + userId, user);
                                    }
                                }
                                return CompletableFuture.completedFuture(null);
                            });

                    futures.add(future);
                }

                return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]));
            }
            return CompletableFuture.completedFuture(null);
        });
    }

    public CompletableFuture<Void> markChatAsRead(String chatId, String userId) {
        return userService.getUserById(userId).thenCompose(optionalUser -> {
            if (optionalUser.isPresent()) {
                User user = optionalUser.get().getUser();
                Map<String, User.ChatInfo> userChats = user.getChatUser();

                if (userChats != null && userChats.containsKey(chatId)) {
                    User.ChatInfo chatInfo = userChats.get(chatId);
                    chatInfo.setUnreadCount(0);
                    userChats.put(chatId, chatInfo);
                    user.setChatUser(userChats);

                    return firebaseService.set(USERS_PATH + "/" + userId, user);
                }
            }
            return CompletableFuture.completedFuture(null);
        });
    }

    public CompletableFuture<Map<String, Message>> getMessagesMap(String chatId) {
        GenericTypeIndicator<Map<String, Message>> typeIndicator = new GenericTypeIndicator<Map<String, Message>>() {};
        return firebaseService.getWithTypeIndicator(CHATS_PATH + "/" + chatId + "/messages", typeIndicator);

    }

}