package com.smarthabit.backend.dto.response;

import com.smarthabit.backend.entity.ChatMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    private ChatMessage userMessage;
    private ChatMessage assistantMessage;
}
