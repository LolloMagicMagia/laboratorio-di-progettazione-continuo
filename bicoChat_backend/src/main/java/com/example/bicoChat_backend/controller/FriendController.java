package com.example.bicoChat_backend.controller;

import com.example.bicoChat_backend.dto.request.FriendRequestDTO;
import com.example.bicoChat_backend.dto.response.FriendResponseDTO;
import com.example.bicoChat_backend.service.FriendService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.function.Function;

@RestController
@RequestMapping("/api/friends")
public class FriendController {

    @Autowired
    private FriendService friendService;

    // ✅ Lista amici attivi
    @GetMapping("/{uid}")
    public CompletableFuture<ResponseEntity<List<FriendResponseDTO>>> getFriends(@PathVariable String uid) {
        return friendService.getFriendsOfUser(uid)
                .thenApply(new java.util.function.Function<List<FriendResponseDTO>, ResponseEntity<List<FriendResponseDTO>>>() {
                    @Override
                    public ResponseEntity<List<FriendResponseDTO>> apply(List<FriendResponseDTO> friends) {
                        return ResponseEntity.ok(friends);
                    }
                });
    }




    // ✅ Invia richiesta di amicizia
    @PostMapping("/request")
    public CompletableFuture<ResponseEntity<String>> sendFriendRequest(@RequestBody FriendRequestDTO request) {
        return friendService.sendFriendRequest(request.getFromUid(), request.getToUid())
                .thenApply(v -> ResponseEntity.ok("Richiesta inviata"));
    }

    // ✅ Richieste ricevute
    @GetMapping("/requests/{uid}")
    public CompletableFuture<List<FriendResponseDTO>> getFriendRequests(@PathVariable String uid) {
        return friendService.getFriendRequestsForUser(uid);
    }

    // ✅ Accetta richiesta
    @PostMapping("/accept")
    public CompletableFuture<ResponseEntity<String>> acceptRequest(@RequestBody FriendRequestDTO request) {
        return friendService.acceptFriendRequest(request.getFromUid(), request.getToUid())
                .thenApply(v -> ResponseEntity.ok("Richiesta accettata"));
    }

    // ✅ Rifiuta richiesta
    @DeleteMapping("/request")
    public CompletableFuture<ResponseEntity<String>> rejectRequest(@RequestBody FriendRequestDTO request) {
        return friendService.rejectFriendRequest(request.getFromUid(), request.getToUid())
                .thenApply(v -> ResponseEntity.ok("Richiesta rifiutata"));
    }

    public FriendController() {
        System.out.println("✅ FriendController inizializzato");
    }

}
