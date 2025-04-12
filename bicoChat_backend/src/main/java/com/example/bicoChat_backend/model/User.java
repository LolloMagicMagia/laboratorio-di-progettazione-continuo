package com.example.bicoChat_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;
import java.util.Objects;

@JsonIgnoreProperties(ignoreUnknown = true)
public class User {

    @JsonProperty("username")
    private String username;

    @JsonProperty("status")
    private String status;

    @JsonProperty("chatUser")
    private Map<String, ChatInfo> chatUser;

    // Chat Info
    public static class ChatInfo {
        @JsonProperty("lastMessage")
        private String lastMessage;

        @JsonProperty("name")
        private String name;

        @JsonProperty("timestamp")
        private String timestamp;

        @JsonProperty("unreadCount")
        private int unreadCount;

        @JsonProperty("lastUser")
        private String lastUser;

        // Empty constructor
        public ChatInfo() {
        }

        // Getters e Setters
        public String getLastMessage() {
            return lastMessage;
        }

        public void setLastMessage(String lastMessage) {
            this.lastMessage = lastMessage;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public String getLastUser() {
            return lastUser;
        }

        public void setLastUser(String lastUser) {
            this.lastUser = lastUser;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }

        public int getUnreadCount() {
            return unreadCount;
        }

        public void setUnreadCount(int unreadCount) {
            this.unreadCount = unreadCount;
        }

        public ChatInfo(String lastMessage, String name, String timestamp, int unreadCount, String lastUser) {
            this.lastMessage = lastMessage;
            this.name = name;
            this.timestamp = timestamp;
            this.unreadCount = unreadCount;
            this.lastUser = lastUser;
        }

        @Override
        public String toString() {
            return "ChatInfo{" +
                    "lastMessage='" + lastMessage + '\'' +
                    ", name='" + name + '\'' +
                    ", timestamp='" + timestamp + '\'' +
                    ", unreadCount=" + unreadCount +
                    ", lastUser='" + lastUser + '\'' +
                    '}';
        }


        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            ChatInfo chatInfo = (ChatInfo) o;
            return unreadCount == chatInfo.unreadCount &&
                    Objects.equals(lastMessage, chatInfo.lastMessage) &&
                    Objects.equals(name, chatInfo.name) &&
                    Objects.equals(timestamp, chatInfo.timestamp);
        }

        @Override
        public int hashCode() {
            return Objects.hash(lastMessage, name, timestamp, unreadCount);
        }
    }

    // Empty constructor for Firebase
    public User() {
    }

    public User(String username, String status, Map<String, ChatInfo> chatUser) {
        this.username = username;
        this.status = status;
        this.chatUser = chatUser;
    }

    // Getter and Setter
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Map<String, ChatInfo> getChatUser() {
        return chatUser;
    }

    public void setChatUser(Map<String, ChatInfo> chatUser) {
        this.chatUser = chatUser;
    }

    // toString
    @Override
    public String toString() {
        return "User{" +
                "username='" + username + '\'' +
                ", status='" + status + '\'' +
                ", chatUser=" + chatUser +
                '}';
    }

    // Equals and HashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(username, user.username) &&
                Objects.equals(status, user.status) &&
                Objects.equals(chatUser, user.chatUser);
    }

    @Override
    public int hashCode() {
        return Objects.hash(username, status, chatUser);
    }
}