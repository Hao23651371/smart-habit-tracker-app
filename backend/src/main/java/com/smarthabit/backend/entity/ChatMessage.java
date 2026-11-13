package com.smarthabit.backend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "chat_messages")
@CompoundIndexes({
    @CompoundIndex(name = "user_created_idx", def = "{'userId': 1, 'createdAt': 1}")
})
public class ChatMessage {
    @Id
    private String id;

    private String userId;

    // "user" | "assistant"
    private String role;

    private String content;

    private ActionButton actionButton;

    @CreatedDate
    private Instant createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActionButton {
        private String label;
        private String action;
        private String value;
    }
}
