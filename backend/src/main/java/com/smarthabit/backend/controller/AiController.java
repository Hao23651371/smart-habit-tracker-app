package com.smarthabit.backend.controller;

import com.smarthabit.backend.dto.request.ChatRequest;
import com.smarthabit.backend.dto.response.ChatResponse;
import com.smarthabit.backend.dto.response.SuggestionResponse;
import com.smarthabit.backend.entity.ChatMessage;
import com.smarthabit.backend.entity.User;
import com.smarthabit.backend.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/ai", "/ai"})
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    /**
     * Lấy lịch sử chat của người dùng hiện tại
     */
    @GetMapping("/chat")
    public ResponseEntity<List<ChatMessage>> getChatHistory(@AuthenticationPrincipal User currentUser) {
        String userId = currentUser != null ? currentUser.getId() : "default_user";
        List<ChatMessage> list = aiService.getChatHistory(userId);
        return ResponseEntity.ok(list);
    }

    /**
     * Gửi tin nhắn mới cho trợ lý AI
     */
    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> sendMessage(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        String userId = currentUser != null ? currentUser.getId() : "default_user";
        ChatResponse response = aiService.sendMessage(userId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Xóa toàn bộ lịch sử trò chuyện
     */
    @DeleteMapping("/chat")
    public ResponseEntity<Void> clearChatHistory(@AuthenticationPrincipal User currentUser) {
        String userId = currentUser != null ? currentUser.getId() : "default_user";
        aiService.clearChatHistory(userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Lấy danh sách gợi ý thói quen thông minh (kèm tham số refresh để AI sinh mới)
     */
    @GetMapping("/suggestions")
    public ResponseEntity<List<SuggestionResponse>> getSuggestions(
            @RequestParam(defaultValue = "false") boolean refresh,
            @AuthenticationPrincipal User currentUser
    ) {
        String userId = currentUser != null ? currentUser.getId() : "default_user";
        List<SuggestionResponse> suggestions = aiService.getSuggestions(userId, refresh);
        return ResponseEntity.ok(suggestions);
    }
}
