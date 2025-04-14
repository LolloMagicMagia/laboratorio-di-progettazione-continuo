package com.example.bicoChat_backend.service;

import com.example.bicoChat_backend.dto.response.FriendResponseDTO;
import com.example.bicoChat_backend.model.User;
import com.google.firebase.database.GenericTypeIndicator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
public class FriendService {

    private static final String USERS_PATH = "users";

    @Autowired
    private FirebaseService firebaseService;

    @Autowired
    private UserService userService;

    // ✅ Recupera tutti gli amici con stato "active", "pending", ecc.
    public CompletableFuture<List<FriendResponseDTO>> getFriendsOfUser(String uid) {
        String path = "users/" + uid + "/friends";
        System.out.println("🔵 [FriendService] getFriendsOfUser chiamato con uid = " + uid);

        return firebaseService.getWithTypeIndicator(path, new GenericTypeIndicator<Map<String, String>>() {})
                .thenCompose(friendMap -> {
                    if (friendMap == null || friendMap.isEmpty()) {
                        return CompletableFuture.completedFuture(new ArrayList<FriendResponseDTO>());
                    }

                    List<CompletableFuture<Optional<User>>> futureUsers = new ArrayList<>();
                    Map<String, String> finalMap = friendMap;

                    for (String friendId : finalMap.keySet()) {
                        futureUsers.add(
                                firebaseService.get("users/" + friendId, User.class).thenApply(Optional::ofNullable)
                        );
                    }

                    return CompletableFuture.allOf(futureUsers.toArray(new CompletableFuture[0]))
                            .thenApply(v -> {
                                List<FriendResponseDTO> result = new ArrayList<>();
                                int i = 0;
                                for (String friendId : finalMap.keySet()) {
                                    String status = finalMap.get(friendId);
                                    Optional<User> maybeUser = futureUsers.get(i++).join();
                                    maybeUser.ifPresent(user -> result.add(new FriendResponseDTO(friendId, user, status)));
                                }
                                return result;
                            });
                })
                .exceptionally(ex -> {
                    System.err.println("❌ Errore nella lettura amici da Firebase:");
                    ex.printStackTrace();
                    return new ArrayList<FriendResponseDTO>(); // tipizzazione fissa
                });
    }




    // ✅ Invia richiesta di amicizia scrivendo su: users/{toUid}/friendRequests/{fromUid} = "pending"
    public CompletableFuture<Void> sendFriendRequest(String fromUid, String toUid) {
        String requestPath = USERS_PATH + "/" + toUid + "/friendRequests/" + fromUid;
        return firebaseService.set(requestPath, "pending");
    }

    public CompletableFuture<Void> acceptFriendRequest(String fromUid, String toUid) {
        Map<String, Object> updates = new HashMap<>();
        updates.put("users/" + fromUid + "/friends/" + toUid, "active");
        updates.put("users/" + toUid + "/friends/" + fromUid, "active");
        updates.put("users/" + toUid + "/friendRequests/" + fromUid, null); // cancella richiesta

        return firebaseService.updateMulti(updates);
    }

    public CompletableFuture<Void> rejectFriendRequest(String fromUid, String toUid) {
        String path = "users/" + toUid + "/friendRequests/" + fromUid;
        return firebaseService.delete(path);
    }

    public CompletableFuture<List<FriendResponseDTO>> getFriendRequestsForUser(String uid) {
        String requestsPath = "users/" + uid + "/friendRequests";

        return firebaseService.getWithTypeIndicator(requestsPath, new GenericTypeIndicator<Map<String, String>>() {})
                .thenCompose(requestMap -> {
                    if (requestMap == null || requestMap.isEmpty()) {
                        return CompletableFuture.completedFuture(Collections.emptyList());
                    }

                    List<CompletableFuture<Optional<User>>> userFutures = new ArrayList<>();
                    Map<String, String> finalMap = requestMap;

                    for (String fromUid : finalMap.keySet()) {
                        CompletableFuture<Optional<User>> userFuture =
                                firebaseService.get("users/" + fromUid, User.class)
                                        .thenApply(Optional::ofNullable);
                        userFutures.add(userFuture);
                    }

                    return CompletableFuture.allOf(userFutures.toArray(new CompletableFuture[0]))
                            .thenApply(v -> {
                                List<FriendResponseDTO> pendingRequests = new ArrayList<>();
                                int i = 0;
                                for (String fromUid : finalMap.keySet()) {
                                    Optional<User> maybeUser = userFutures.get(i++).join();
                                    if (maybeUser.isPresent()) {
                                        pendingRequests.add(new FriendResponseDTO(fromUid, maybeUser.get(), "pending"));
                                    }
                                }
                                return pendingRequests;
                            });
                });
    }

}
