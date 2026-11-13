package com.smarthabit.backend.service;

import com.smarthabit.backend.dto.request.ChatRequest;
import com.smarthabit.backend.dto.response.ChatResponse;
import com.smarthabit.backend.dto.response.SuggestionResponse;
import com.smarthabit.backend.entity.ChatMessage;
import com.smarthabit.backend.entity.Habit;
import com.smarthabit.backend.entity.User;
import com.smarthabit.backend.repository.ChatMessageRepository;
import com.smarthabit.backend.repository.HabitRepository;
import com.smarthabit.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final ChatMessageRepository chatMessageRepository;
    private final HabitRepository habitRepository;
    private final UserRepository userRepository;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private static final String SYSTEM_PROMPT = """
        Bạn là "Trợ lý Thói quen" (Smart Habit Assistant) của ứng dụng Smart Habit Tracker.

        [VAI TRÒ & PHẠM VI HỖ TRỢ]:
        - Bạn là huấn luyện viên kỷ luật cá nhân và đồng hành rèn luyện lối sống khoa học.
        - CHUYÊN MÔN: Xây dựng thói quen tốt (sức khỏe, uống nước, học tập, giấc ngủ, tinh thần, công việc), duy trì chuỗi Streak, quản lý thời gian, vượt qua trì hoãn (phương pháp Atomic Habits, quy tắc 2 phút, Habit Stacking).
        - RÀNG BUỘC PHẠM VI (TUYỆT ĐỐI TUÂN THỦ):
          Nếu người dùng nói tục, chửi bậy, khiêu dâm, hoặc hỏi các chủ đề hoàn toàn không liên quan đến thói quen & phát triển bản thân (chính trị, bói toán, lập trình phần mềm phức tạp, y tế kê đơn thuốc,...):
          Bạn PHẢI từ chối lịch sự và thông báo rõ phạm vi của bạn:
          "Xin lỗi bạn, mình là Trợ lý Rèn luyện Thói quen & Kỷ luật. Mình chỉ có thể hỗ trợ bạn về việc xây dựng thói quen, quản lý thời gian và duy trì lối sống lành mạnh. Bạn có muốn mình giúp lên kế hoạch cho một thói quen nào hôm nay không?".

        [XƯNG HÔ & PHONG CÁCH]:
        - Xưng hô: Xưng "mình" hoặc "Trợ lý AI", gọi người dùng là "bạn" (hoặc xưng hô theo tên người dùng nếu có).
        - Giọng văn: Ấm áp, lịch sự, tôn trọng, truyền cảm hứng và thực tế.

        [RÀNG BUỘC ĐỘ DÀI & ĐỀ XUẤT]:
        - TRẢ LỜI NGẮN GỌN, SÚC TÍCH: Chỉ từ 2 đến 4 đoạn ngắn hoặc vài gạch đầu dòng cô đọng, dễ đọc trên màn hình điện thoại. Không viết dài lê thê.
        - Ở CUỐI MỖI CÂU TRẢ LỜI: BẮT BUỘC đưa ra 1-2 đề xuất cụ thể tiếp theo HOẶC hỏi lại người dùng xem gợi ý như vậy đã phù hợp với lịch sinh hoạt của bạn chưa.
        """;

    /**
     * Lấy lịch sử chat của user. Nếu chưa có tin nhắn nào, trả về lời chào khởi động ngắn gọn.
     */
    public List<ChatMessage> getChatHistory(String userId) {
        List<ChatMessage> list = chatMessageRepository.findByUserIdOrderByCreatedAtAsc(userId);
        User user = userRepository.findById(userId).orElse(null);
        String name = user != null ? (user.getFullName() != null ? user.getFullName() : "bạn") : "bạn";

        if (list.isEmpty()) {
            // Tạo tin nhắn chào mừng khởi đầu ngắn gọn
            ChatMessage welcomeMsg = ChatMessage.builder()
                    .userId(userId)
                    .role("assistant")
                    .content("Chào " + name + "! 👋 Rất vui được gặp bạn. Hôm nay bạn đang muốn lên kế hoạch hoặc cải thiện thói quen nào?")
                    .createdAt(Instant.now())
                    .build();

            ChatMessage saved = chatMessageRepository.save(welcomeMsg);
            return List.of(saved);
        }

        // Tự động rút gọn tin nhắn cũ dài nếu có
        if (list.size() == 1 && list.get(0).getContent() != null && list.get(0).getContent().contains("Mình có thể đồng hành cùng bạn:")) {
            ChatMessage firstMsg = list.get(0);
            firstMsg.setContent("Chào " + name + "! 👋 Rất vui được gặp bạn. Hôm nay bạn đang muốn lên kế hoạch hoặc cải thiện thói quen nào?");
            chatMessageRepository.save(firstMsg);
        }

        return list;
    }

    /**
     * Gửi tin nhắn và nhận phản hồi từ Gemini AI (hoặc fallback thông minh)
     */
    public ChatResponse sendMessage(String userId, ChatRequest request) {
        String userContent = request.getContent().trim();

        // 1. Lưu tin nhắn của User
        ChatMessage userMsg = ChatMessage.builder()
                .userId(userId)
                .role("user")
                .content(userContent)
                .createdAt(Instant.now())
                .build();
        ChatMessage savedUserMsg = chatMessageRepository.save(userMsg);

        // 2. Thu thập ngữ cảnh của User (Tên, thói quen hiện có)
        User user = userRepository.findById(userId).orElse(null);
        String userName = user != null ? (user.getFullName() != null ? user.getFullName() : "bạn") : "bạn";

        List<Habit> habits = habitRepository.findByUserId(userId);
        StringBuilder habitContext = new StringBuilder("Thói quen hiện tại của " + userName + ": ");
        for (Habit h : habits) {
            habitContext.append("- ").append(h.getTitle()).append(" (Khung giờ: ").append(h.getTimeSlot()).append(")\n");
        }

        // 3. Kiểm tra lọc từ ngữ thô tục / ngoài phạm vi cục bộ trước
        String lower = userContent.toLowerCase();
        if (isOutOfScopeOrInappropriate(lower)) {
            String rejectContent = "Xin lỗi " + userName + ", mình là Trợ lý Rèn luyện Thói quen & Kỷ luật. Mình chỉ có thể hỗ trợ bạn về việc xây dựng thói quen, quản lý thời gian, dinh dưỡng sinh hoạt và duy trì lối sống lành mạnh.\n\n👉 Bạn có muốn mình giúp bạn lên kế hoạch cho một thói quen tích cực nào hôm nay không?";
            ChatMessage assistantMsg = ChatMessage.builder()
                    .userId(userId)
                    .role("assistant")
                    .content(rejectContent)
                    .createdAt(Instant.now())
                    .build();
            ChatMessage savedAssistantMsg = chatMessageRepository.save(assistantMsg);
            return new ChatResponse(savedUserMsg, savedAssistantMsg);
        }

        // 4. Gọi Gemini API nếu có key
        String aiReply = null;
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            aiReply = callGeminiApi(userContent, userName, habitContext.toString());
        }

        // 5. Nếu không gọi được Gemini (chưa có key hoặc mạng lỗi) -> Fallback thông minh tuân thủ đúng ràng buộc
        if (aiReply == null || aiReply.isBlank()) {
            aiReply = generateFallbackReply(userContent, userName, habits);
        }

        // Tự động nhận diện thói quen được đề xuất để gắn nút hành động
        ChatMessage.ActionButton actionBtn = detectActionButton(aiReply);

        ChatMessage assistantMsg = ChatMessage.builder()
                .userId(userId)
                .role("assistant")
                .content(aiReply)
                .actionButton(actionBtn)
                .createdAt(Instant.now())
                .build();
        ChatMessage savedAssistantMsg = chatMessageRepository.save(assistantMsg);

        return new ChatResponse(savedUserMsg, savedAssistantMsg);
    }

    private static final List<String> CANDIDATE_MODELS = List.of(
            "gemini-1.5-flash",
            "gemini-2.0-flash",
            "gemini-2.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-2.0-flash-exp"
    );
    private static volatile String activeGeminiModel = null;

    /**
     * Gửi yêu cầu tới Gemini API với cơ chế tự thử các mô hình tương thích (khắc phục triệt để 404 NotFound)
     */
    private String sendGeminiRequest(String requestBody) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) return null;

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        // 1. Thử model đã xác thực thành công trước đó
        if (activeGeminiModel != null) {
            String res = tryModelEndpoint(client, activeGeminiModel, requestBody);
            if (res != null) return res;
            activeGeminiModel = null;
        }

        // 2. Thử lần lượt các candidate model phổ biến
        for (String model : CANDIDATE_MODELS) {
            String res = tryModelEndpoint(client, model, requestBody);
            if (res != null) {
                activeGeminiModel = model;
                log.info("Xác thực mô hình Gemini thành công: {}", model);
                return res;
            }
        }

        // 3. Nếu vẫn không được, truy vấn động danh sách mô hình từ tài khoản người dùng qua ListModels API
        List<String> discovered = fetchAvailableModels(client);
        for (String model : discovered) {
            String res = tryModelEndpoint(client, model, requestBody);
            if (res != null) {
                activeGeminiModel = model;
                log.info("Tự động kết nối mô hình Gemini phát hiện từ tài khoản: {}", model);
                return res;
            }
        }

        return null;
    }

    private List<String> fetchAvailableModels(HttpClient client) {
        List<String> list = new ArrayList<>();
        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models?key=" + geminiApiKey;
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .timeout(Duration.ofSeconds(10))
                    .build();
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200 && resp.body() != null) {
                String body = resp.body();
                int idx = 0;
                while ((idx = body.indexOf("\"name\": \"models/", idx)) != -1 || (idx = body.indexOf("\"name\":\"models/", idx)) != -1) {
                    int start = body.indexOf("models/", idx) + 7;
                    int end = body.indexOf("\"", start);
                    if (end != -1) {
                        String mod = body.substring(start, end);
                        if (!list.contains(mod) && mod.startsWith("gemini") && !mod.contains("embedding")) {
                            list.add(mod);
                        }
                        idx = end;
                    } else {
                        break;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Không thể khám phá mô hình qua ListModels: {}", e.getMessage());
        }
        return list;
    }

    private String tryModelEndpoint(HttpClient client, String model, String requestBody) {
        String[] versions = {"v1beta", "v1"};
        for (String ver : versions) {
            try {
                String url = "https://generativelanguage.googleapis.com/" + ver + "/models/" + model + ":generateContent?key=" + geminiApiKey;
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                        .timeout(Duration.ofSeconds(15))
                        .build();

                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() == 200) {
                    return response.body();
                } else if (response.statusCode() == 404) {
                    log.warn("Gemini model {} ({}) trả 404 NotFound, đang thử mô hình tương thích tiếp theo...", model, ver);
                } else {
                    log.warn("Gemini API {} ({}) trả mã {}: {}", model, ver, response.statusCode(), response.body());
                }
            } catch (Exception e) {
                log.error("Lỗi khi kết nối Gemini API {}: {}", model, e.getMessage());
            }
        }
        return null;
    }

    /**
     * Gọi Google Gemini API bằng HttpClient
     */
    private String callGeminiApi(String userContent, String userName, String habitContext) {
        try {
            String fullSystemInstruction = SYSTEM_PROMPT + "\n\nThông tin người dùng: " + userName + ".\n" + habitContext;
            String requestBody = buildGeminiPayload(fullSystemInstruction, userContent);
            String responseBody = sendGeminiRequest(requestBody);

            if (responseBody != null) {
                String extracted = extractTextFromGeminiResponse(responseBody);
                if (extracted != null && !extracted.isBlank()) {
                    return extracted;
                }
            }
        } catch (Exception e) {
            log.error("Lỗi khi gọi Gemini API: {}", e.getMessage());
        }
        return null;
    }

    private ChatMessage.ActionButton detectActionButton(String reply) {
        if (reply == null) return null;
        int q1 = reply.indexOf("'");
        int q2 = -1;
        if (q1 != -1) {
            q2 = reply.indexOf("'", q1 + 1);
        }
        if (q1 != -1 && q2 > q1 + 3 && q2 - q1 < 40) {
            String habitName = reply.substring(q1 + 1, q2).trim();
            if (!habitName.toLowerCase().contains("http") && !habitName.toLowerCase().contains("quy tắc")) {
                return ChatMessage.ActionButton.builder()
                        .label("+ Thêm thói quen \"" + habitName + "\"")
                        .action("ADD_HABIT")
                        .value(habitName)
                        .build();
            }
        }
        return null;
    }

    private String buildGeminiPayload(String systemInstruction, String userText) {
        return "{"
                + "\"systemInstruction\":{\"parts\":[{\"text\":\"" + escapeJson(systemInstruction) + "\"}]},"
                + "\"contents\":[{\"role\":\"user\",\"parts\":[{\"text\":\"" + escapeJson(userText) + "\"}]}],"
                + "\"generationConfig\":{\"temperature\":0.7,\"maxOutputTokens\":600}"
                + "}";
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\b' -> sb.append("\\b");
                case '\f' -> sb.append("\\f");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < ' ') {
                        String hex = String.format("\\u%04x", (int) c);
                        sb.append(hex);
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        return sb.toString();
    }

    private String extractTextFromGeminiResponse(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) return null;
        int textIdx = responseBody.indexOf("\"text\": \"");
        int offset = 9;
        if (textIdx == -1) {
            textIdx = responseBody.indexOf("\"text\":\"");
            offset = 8;
        }
        if (textIdx == -1) return null;

        int start = textIdx + offset;
        StringBuilder sb = new StringBuilder();
        boolean escape = false;

        for (int i = start; i < responseBody.length(); i++) {
            char c = responseBody.charAt(i);
            if (escape) {
                switch (c) {
                    case '"' -> sb.append('"');
                    case '\\' -> sb.append('\\');
                    case '/' -> sb.append('/');
                    case 'b' -> sb.append('\b');
                    case 'f' -> sb.append('\f');
                    case 'n' -> sb.append('\n');
                    case 'r' -> sb.append('\r');
                    case 't' -> sb.append('\t');
                    case 'u' -> {
                        if (i + 4 < responseBody.length()) {
                            try {
                                int code = Integer.parseInt(responseBody.substring(i + 1, i + 5), 16);
                                sb.append((char) code);
                                i += 4;
                            } catch (Exception ignored) {
                                sb.append(c);
                            }
                        }
                    }
                    default -> sb.append(c);
                }
                escape = false;
            } else if (c == '\\') {
                escape = true;
            } else if (c == '"') {
                break;
            } else {
                sb.append(c);
            }
        }

        return sb.toString().trim();
    }

    /**
     * Fallback phản hồi thông minh chuẩn xác theo system prompt khi Gemini API chưa kết nối
     */
    private String generateFallbackReply(String userContent, String userName, List<Habit> habits) {
        String lower = userContent.toLowerCase();

        if (lower.contains("dậy sớm") || lower.contains("thức dậy")) {
            return "Chào " + userName + "! Để dậy sớm mà không mệt mỏi, bạn có thể áp dụng 3 bước nhỏ:\n\n" +
                    "1. Đi ngủ sớm hơn 30 phút và không dùng điện thoại trên giường.\n" +
                    "2. Đặt ly nước ấm cạnh bàn để uống ngay khi vừa mở mắt.\n" +
                    "3. Đặt chuông báo thức cách xa giường để bắt buộc phải ngồi dậy.\n\n" +
                    "👉 Bạn muốn mình đặt thói quen 'Thức dậy lúc 06:30' vào buổi sáng cho bạn không?";
        }

        if (lower.contains("nước") || lower.contains("uống nước")) {
            return "Chào " + userName + "! Uống đủ nước là nền tảng tuyệt vời cho năng lượng cả ngày:\n\n" +
                    "• Uống 1 ly ngay khi thức dậy để thanh lọc cơ thể.\n" +
                    "• Chia đều các cữ cách nhau 2 tiếng thay vì đợi khát mới uống.\n\n" +
                    "👉 Hiện tại bạn đã có thói quen uống nước chưa, hay cần mình hỗ trợ cài lời nhắc trước 10 phút?";
        }

        if (lower.contains("đọc sách") || lower.contains("học")) {
            return "Chào " + userName + "! Bí quyết đọc sách bền bỉ là áp dụng 'Quy tắc 2 phút':\n\n" +
                    "• Đừng đặt mục tiêu 30 phút ngay, hãy bắt đầu với đúng 5 trang sách mỗi tối lúc 20:30.\n" +
                    "• Đọc xong đánh dấu trang và tick hoàn thành để não bộ ghi nhận cảm giác chiến thắng!\n\n" +
                    "👉 Bạn thấy thời lượng 5 trang lúc 20:30 có vừa sức với lịch của bạn không?";
        }

        if (lower.contains("streak") || lower.contains("chuỗi") || lower.contains("bỏ lỡ")) {
            return "Chào " + userName + "! Trong tâm lý học thói quen, có quy tắc vàng: 'Không bao giờ bỏ lỡ 2 lần liên tiếp'.\n\n" +
                    "Nếu hôm nay bạn lỡ quên, đừng tự trách. Chỉ cần ngày mai hoàn thành ít nhất 1 thói quen nhỏ nhất, bạn sẽ giữ vững đà kỷ luật.\n\n" +
                    "👉 Hôm nay bạn có muốn cùng mình hoàn thành một thói quen nhẹ nhàng nào trước không?";
        }

        if (lower.contains("ngủ") || lower.contains("mất ngủ") || lower.contains("giấc ngủ")) {
            return "Chào " + userName + "! Để có giấc ngủ sâu và tái tạo năng lượng hiệu quả:\n\n" +
                    "• Tắt màn hình điện thoại trước giờ ngủ 30 phút để tránh ánh sáng xanh.\n" +
                    "• Giữ phòng ngủ thoáng mát và thực hiện hít thở sâu 4-7-8 trong 3 phút.\n\n" +
                    "👉 Bạn có muốn mình tạo thói quen 'Tắt điện thoại lúc 22:30' cho bạn không?";
        }

        if (lower.contains("tập thể dục") || lower.contains("chạy bộ") || lower.contains("đi bộ") || lower.contains("gym")) {
            return "Chào " + userName + "! Khi bắt đầu tập luyện, sự kiên trì quan trọng hơn cường độ:\n\n" +
                    "• Hãy bắt đầu với 10-15 phút vận động nhẹ mỗi ngày vào khung giờ cố định.\n" +
                    "• Chuẩn bị sẵn giày và trang phục tập từ tối hôm trước để giảm ma sát hành động.\n\n" +
                    "👉 Bạn muốn chọn khung giờ buổi sáng hay buổi chiều để bắt đầu thói quen này?";
        }

        if (lower.contains("trì hoãn") || lower.contains("lười") || lower.contains("động lực")) {
            return "Chào " + userName + "! Cảm giác lười hay trì hoãn là hoàn toàn tự nhiên khi mục tiêu có vẻ quá lớn:\n\n" +
                    "• Áp dụng 'Quy tắc 2 phút': Chỉ cam kết làm việc đó trong đúng 2 phút đầu tiên.\n" +
                    "• Khi đã bắt đầu bước chân đầu tiên, quán tính não bộ sẽ giúp bạn tiếp tục dễ dàng hơn rất nhiều!\n\n" +
                    "👉 Bạn đang muốn hoàn thành công việc cụ thể nào? Hãy chia sẻ với mình nhé!";
        }

        if (lower.contains("kỷ luật") || lower.contains("thời gian") || lower.contains("pomodoro")) {
            return "Chào " + userName + "! Kỷ luật không phải là gò bó, mà là tự do lựa chọn điều bạn thực sự mong muốn:\n\n" +
                    "• Thử kỹ thuật Pomodoro: Tập trung cao độ 25 phút, sau đó nghỉ ngơi trọn vẹn 5 phút.\n" +
                    "• Giới hạn chỉ chọn 3 việc quan trọng nhất cần hoàn thành trong ngày.\n\n" +
                    "👉 Bạn có muốn thử áp dụng khung tập trung 25 phút cho buổi làm việc sắp tới không?";
        }

        // Trả lời tổng quát
        return "Chào " + userName + "! Mình đã ghi nhận câu hỏi của bạn. Để hình thành thói quen vững chắc, bí quyết là bắt đầu thật nhỏ và gắn thói quen mới vào sau một việc bạn đã làm hằng ngày.\n\n" +
                "👉 Bạn có muốn mình gợi ý một kế hoạch 7 ngày cụ thể cho mục tiêu này không?";
    }

    private boolean isOutOfScopeOrInappropriate(String lower) {
        // 1. Từ ngữ thô tục, chửi bậy, nhạy cảm
        String[] badWords = {
                "đm", "đmm", "dcm", "vcl", "clm", "chửi", "địt", "lừa đảo", "hack",
                "sex", "khiêu dâm", "gái gú", "đánh nhau", "cờ bạc", "lô đề", "ma túy", "tự tử"
        };
        for (String w : badWords) {
            if (lower.contains(w)) return true;
        }

        // 2. Các chủ đề hoàn toàn ngoài phạm vi trợ lý thói quen
        String[] outOfScope = {
                "lập trình java", "viết code", "code python", "bầu cử", "chính trị",
                "chiến tranh", "kê đơn thuốc", "uống thuốc gì", "chữa bệnh ung thư",
                "bói toán", "xem tướng", "tử vi", "giá vàng", "chứng khoán", "mua cổ phiếu",
                "tổng thống", "hack facebook"
        };
        for (String s : outOfScope) {
            if (lower.contains(s)) return true;
        }

        return false;
    }

    /**
     * Xóa toàn bộ lịch sử chat của user
     */
    public void clearChatHistory(String userId) {
        chatMessageRepository.deleteByUserId(userId);
    }

    /**
     * Gợi ý thói quen thông minh
     */
    public List<SuggestionResponse> getSuggestions(String userId) {
        return getSuggestions(userId, false);
    }

    /**
     * Gợi ý thói quen thông minh qua AI (Gemini hoặc bộ sinh thói quen động đa dạng)
     */
    public List<SuggestionResponse> getSuggestions(String userId, boolean refresh) {
        // Thu thập thói quen hiện tại để tránh trùng lặp
        List<Habit> userHabits = habitRepository.findByUserId(userId);
        StringBuilder existingHabitTitles = new StringBuilder();
        for (Habit h : userHabits) {
            existingHabitTitles.append(h.getTitle()).append(", ");
        }

        // 1. Thử gọi Gemini AI để tự soạn thói quen mới cá nhân hóa
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            List<SuggestionResponse> aiSuggestions = generateSuggestionsWithGemini(existingHabitTitles.toString());
            if (aiSuggestions != null && !aiSuggestions.isEmpty()) {
                return aiSuggestions;
            }
        }

        // 2. Nếu chưa có kết nối Gemini, sử dụng kho thói quen thông minh xoay vòng ngẫu nhiên
        return getRandomCatalogSuggestions(refresh, existingHabitTitles.toString());
    }

    /**
     * Yêu cầu Gemini AI tự sinh 3 gợi ý thói quen kèm kế hoạch 7 ngày định dạng JSON
     */
    private List<SuggestionResponse> generateSuggestionsWithGemini(String existingHabits) {
        try {
            String prompt = "Bạn là Trợ lý AI của ứng dụng Smart Habit Tracker. Hãy đề xuất 3 thói quen mới thiết thực, khoa học và hấp dẫn để người dùng rèn luyện bản thân.\n" +
                    "Các thói quen người dùng đã có: " + (existingHabits.isBlank() ? "chưa có" : existingHabits) + ".\n" +
                    "YÊU CẦU: Trả về DUY NHẤT một mảng JSON hợp lệ (không kèm markdown code fence ```json, không giải thích thêm), mỗi phần tử là 1 object có đủ các trường:\n" +
                    "- \"title\": Tên thói quen ngắn gọn\n" +
                    "- \"tag\": Thẻ mục đích ngắn (ví dụ: #Năng lượng, #Sức khỏe, #Tập trung)\n" +
                    "- \"frequency\": \"daily\" hoặc \"weekly\"\n" +
                    "- \"timeSlot\": một trong [\"morning\", \"noon\", \"afternoon\", \"evening\"]\n" +
                    "- \"defaultTime\": giờ nhắc dạng HH:mm\n" +
                    "- \"reason\": 1 câu giải thích khoa học ngắn gọn vì sao thói quen này tốt\n" +
                    "- \"matchLabel\": \"Rất phù hợp\" hoặc \"Phù hợp\"\n" +
                    "- \"categoryCode\": một trong [\"health\", \"study\", \"sleep\", \"mind\", \"work\", \"finance\"]\n" +
                    "- \"plan7Days\": mảng gồm đúng 3 chuỗi mô tả 3 giai đoạn (ví dụ [\"Ngày 1-2: ...\", \"Ngày 3-4: ...\", \"Ngày 5-7: ...\"])";

            String requestBody = buildGeminiPayload("Bạn là hệ thống đề xuất thói quen trả về JSON mảng.", prompt);
            String responseBody = sendGeminiRequest(requestBody);

            if (responseBody != null) {
                String extracted = extractTextFromGeminiResponse(responseBody);
                if (extracted != null && !extracted.isBlank()) {
                    List<SuggestionResponse> parsed = parseGeminiSuggestions(extracted);
                    if (!parsed.isEmpty()) {
                        return parsed;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Lỗi khi gọi Gemini gợi ý thói quen: {}", e.getMessage());
        }
        return Collections.emptyList();
    }

    /**
     * Bóc tách mảng JSON từ phản hồi của Gemini
     */
    private List<SuggestionResponse> parseGeminiSuggestions(String text) {
        List<SuggestionResponse> list = new ArrayList<>();
        if (text == null || text.isBlank()) return list;

        String clean = text.trim();
        if (clean.startsWith("```json")) clean = clean.substring(7);
        if (clean.startsWith("```")) clean = clean.substring(3);
        if (clean.endsWith("```")) clean = clean.substring(0, clean.length() - 3);
        clean = clean.trim();

        int startIdx = clean.indexOf("[");
        int endIdx = clean.lastIndexOf("]");
        if (startIdx == -1 || endIdx == -1 || endIdx <= startIdx) return list;

        String arrayContent = clean.substring(startIdx + 1, endIdx).trim();
        List<String> objectStrings = new ArrayList<>();
        int braceCount = 0;
        int objStart = -1;
        for (int i = 0; i < arrayContent.length(); i++) {
            char c = arrayContent.charAt(i);
            if (c == '{') {
                if (braceCount == 0) objStart = i;
                braceCount++;
            } else if (c == '}') {
                braceCount--;
                if (braceCount == 0 && objStart != -1) {
                    objectStrings.add(arrayContent.substring(objStart, i + 1));
                    objStart = -1;
                }
            }
        }

        for (int i = 0; i < objectStrings.size(); i++) {
            String obj = objectStrings.get(i);
            String title = extractJsonField(obj, "title");
            if (title == null || title.isBlank()) continue;

            String tag = extractJsonField(obj, "tag");
            String frequency = extractJsonField(obj, "frequency");
            String timeSlot = extractJsonField(obj, "timeSlot");
            String defaultTime = extractJsonField(obj, "defaultTime");
            String reason = extractJsonField(obj, "reason");
            String matchLabel = extractJsonField(obj, "matchLabel");
            String categoryCode = extractJsonField(obj, "categoryCode");
            List<String> plan7Days = extractJsonStringArray(obj, "plan7Days");

            list.add(SuggestionResponse.builder()
                    .id("sug_ai_" + System.currentTimeMillis() + "_" + i)
                    .title(title)
                    .tag(tag != null ? tag : "#Thói quen tích cực")
                    .frequency(frequency != null ? frequency : "daily")
                    .timeSlot(timeSlot != null ? timeSlot : "morning")
                    .defaultTime(defaultTime != null ? defaultTime : "07:00")
                    .reason(reason != null ? reason : "Giúp bạn duy trì kỷ luật và nâng cao chất lượng cuộc sống.")
                    .matchLabel(matchLabel != null ? matchLabel : "Rất phù hợp")
                    .categoryCode(categoryCode != null ? categoryCode : "health")
                    .plan7Days(plan7Days.isEmpty() ? List.of(
                            "Ngày 1-2: Bắt đầu với bước nhỏ nhất",
                            "Ngày 3-4: Thực hiện đều đặn đúng giờ",
                            "Ngày 5-7: Định hình phản xạ thói quen tự nhiên"
                    ) : plan7Days)
                    .build());
        }
        return list;
    }

    private String extractJsonField(String json, String key) {
        String pattern = "\"" + key + "\"";
        int keyIdx = json.indexOf(pattern);
        if (keyIdx == -1) return null;
        int colonIdx = json.indexOf(":", keyIdx + pattern.length());
        if (colonIdx == -1) return null;
        int startQuote = json.indexOf("\"", colonIdx + 1);
        if (startQuote == -1) return null;
        int endQuote = -1;
        for (int i = startQuote + 1; i < json.length(); i++) {
            if (json.charAt(i) == '"' && json.charAt(i - 1) != '\\') {
                endQuote = i;
                break;
            }
        }
        if (endQuote == -1) return null;
        return json.substring(startQuote + 1, endQuote).replace("\\\"", "\"").replace("\\n", "\n").trim();
    }

    private List<String> extractJsonStringArray(String json, String key) {
        List<String> result = new ArrayList<>();
        String pattern = "\"" + key + "\"";
        int keyIdx = json.indexOf(pattern);
        if (keyIdx == -1) return result;
        int openBracket = json.indexOf("[", keyIdx + pattern.length());
        if (openBracket == -1) return result;
        int closeBracket = json.indexOf("]", openBracket);
        if (closeBracket == -1) return result;

        String inside = json.substring(openBracket + 1, closeBracket);
        boolean inQuote = false;
        StringBuilder cur = new StringBuilder();
        for (int i = 0; i < inside.length(); i++) {
            char c = inside.charAt(i);
            if (c == '"' && (i == 0 || inside.charAt(i - 1) != '\\')) {
                if (inQuote) {
                    result.add(cur.toString().trim());
                    cur.setLength(0);
                    inQuote = false;
                } else {
                    inQuote = true;
                }
            } else if (inQuote) {
                cur.append(c);
            }
        }
        return result;
    }

    /**
     * Danh mục thói quen thông minh xoay vòng phong phú (15 thói quen đa dạng theo các lĩnh vực)
     */
    private List<SuggestionResponse> getRandomCatalogSuggestions(boolean refresh, String existingHabits) {
        List<SuggestionResponse> all = List.of(
                SuggestionResponse.builder()
                        .id("sug_pool_1")
                        .title("Uống 500ml nước ấm sau khi dậy")
                        .tag("#Khởi động trao đổi chất")
                        .frequency("daily")
                        .timeSlot("morning")
                        .defaultTime("06:45")
                        .reason("Uống nước sau giấc ngủ dài giúp kích hoạt các cơ quan nội tạng và tỉnh táo nhanh chóng.")
                        .matchLabel("Rất phù hợp")
                        .categoryCode("health")
                        .plan7Days(List.of(
                                "Ngày 1-2: Chuẩn bị cốc nước sẵn cạnh giường từ tối",
                                "Ngày 3-4: Uống chậm rãi 300ml sau khi ngồi dậy",
                                "Ngày 5-7: Đạt mốc 500ml nước ấm mỗi sáng"
                        ))
                        .build(),
                SuggestionResponse.builder()
                        .id("sug_pool_2")
                        .title("Đọc 5 trang sách buổi tối")
                        .tag("#Phát triển bản thân")
                        .frequency("daily")
                        .timeSlot("evening")
                        .defaultTime("20:30")
                        .reason("Duy trì 5 trang sách mỗi ngày tích lũy tương đương 10-12 cuốn sách mỗi năm.")
                        .matchLabel("Rất phù hợp")
                        .categoryCode("study")
                        .plan7Days(List.of(
                                "Ngày 1-2: Đặt cuốn sách yêu thích trên gối",
                                "Ngày 3-4: Đọc đúng 5 trang trước khi ngủ",
                                "Ngày 5-7: Ghi lại 1 câu tâm đắc vào sổ"
                        ))
                        .build(),
                SuggestionResponse.builder()
                        .id("sug_pool_3")
                        .title("Thiền buông thư 5 phút")
                        .tag("#Thư giãn tâm trí")
                        .frequency("daily")
                        .timeSlot("evening")
                        .defaultTime("21:30")
                        .reason("Giảm căng thẳng sau ngày làm việc, giúp vào giấc ngủ sâu và ngon hơn.")
                        .matchLabel("Phù hợp")
                        .categoryCode("mind")
                        .plan7Days(List.of(
                                "Ngày 1-2: Ngồi thẳng lưng, hít thở sâu 3 phút",
                                "Ngày 3-4: Tập trung vào luồng hơi thở",
                                "Ngày 5-7: Duy trì 5 phút thiền tĩnh tâm mỗi tối"
                        ))
                        .build(),
                SuggestionResponse.builder()
                        .id("sug_pool_4")
                        .title("Vươn vai & duỗi cơ 5 phút")
                        .tag("#Năng lượng buổi sáng")
                        .frequency("daily")
                        .timeSlot("morning")
                        .defaultTime("06:30")
                        .reason("Kéo giãn gân cốt kích thích lưu thông máu và giải phóng hormone endorphin sảng khoái.")
                        .matchLabel("Rất phù hợp")
                        .categoryCode("health")
                        .plan7Days(List.of(
                                "Ngày 1-2: Xoay cổ tay, cổ chân nhẹ nhàng trên giường",
                                "Ngày 3-4: Đứng dậy thực hiện 3 động tác vươn vai",
                                "Ngày 5-7: Trọn vẹn bài giãn cơ 5 phút sau khi thức dậy"
                        ))
                        .build(),
                SuggestionResponse.builder()
                        .id("sug_pool_5")
                        .title("Ghi chép chi tiêu trong ngày")
                        .tag("#Kỷ luật tài chính")
                        .frequency("daily")
                        .timeSlot("evening")
                        .defaultTime("21:00")
                        .reason("Theo dõi dòng tiền hàng ngày giúp loại bỏ các khoản chi lãng phí tới 20% mỗi tháng.")
                        .matchLabel("Rất phù hợp")
                        .categoryCode("finance")
                        .plan7Days(List.of(
                                "Ngày 1-2: Ghi lại 1 khoản chi lớn nhất trong ngày",
                                "Ngày 3-4: Ghi đầy đủ các khoản tiền ăn và mua sắm",
                                "Ngày 5-7: Tổng kết tuần và phân loại chi tiêu cần thiết"
                        ))
                        .build(),
                SuggestionResponse.builder()
                        .id("sug_pool_6")
                        .title("Lập danh sách 3 việc quan trọng nhất")
                        .tag("#Tập trung năng suất")
                        .frequency("daily")
                        .timeSlot("morning")
                        .defaultTime("08:00")
                        .reason("Nguyên lý Ivy Lee: Tập trung hoàn thành 3 việc quan trọng nhất trước khi làm việc khác.")
                        .matchLabel("Rất phù hợp")
                        .categoryCode("work")
                        .plan7Days(List.of(
                                "Ngày 1-2: Viết ra giấy 1 việc quan trọng nhất buổi sáng",
                                "Ngày 3-4: Hoàn thành việc quan trọng trước 11:00",
                                "Ngày 5-7: Thiết lập bộ 3 ưu tiên (Big Three) mỗi ngày"
                        ))
                        .build(),
                SuggestionResponse.builder()
                        .id("sug_pool_7")
                        .title("Tắt điện thoại trước khi ngủ 30 phút")
                        .tag("#Bảo vệ giấc ngủ sâu")
                        .frequency("daily")
                        .timeSlot("evening")
                        .defaultTime("22:30")
                        .reason("Ánh sáng xanh ức chế melatonin, tắt thiết bị giúp bạn chìm vào giấc ngủ nhanh hơn 40%.")
                        .matchLabel("Phù hợp")
                        .categoryCode("sleep")
                        .plan7Days(List.of(
                                "Ngày 1-2: Để điện thoại xa tầm tay khi lên giường",
                                "Ngày 3-4: Bật chế độ không làm phiền từ 22:30",
                                "Ngày 5-7: Đọc sách giấy hoặc nghe nhạc êm dịu thay vì lướt mạng"
                        ))
                        .build(),
                SuggestionResponse.builder()
                        .id("sug_pool_8")
                        .title("Đi bộ nhanh 15 phút sau ăn")
                        .tag("#Hỗ trợ tiêu hóa")
                        .frequency("daily")
                        .timeSlot("noon")
                        .defaultTime("12:30")
                        .reason("Vận động nhẹ sau bữa trưa giúp kiểm soát đường huyết và tránh cảm giác buồn ngủ gà gật.")
                        .matchLabel("Rất phù hợp")
                        .categoryCode("health")
                        .plan7Days(List.of(
                                "Ngày 1-2: Đi bộ thư thả 5 phút quanh văn phòng/nhà",
                                "Ngày 3-4: Tăng lên 10 phút hít thở không khí tự nhiên",
                                "Ngày 5-7: Duy trì 15 phút đi bộ nhanh đều đặn mỗi trưa"
                        ))
                        .build(),
                SuggestionResponse.builder()
                        .id("sug_pool_9")
                        .title("Viết nhật ký 3 điều biết ơn")
                        .tag("#Nuôi dưỡng tâm hồn")
                        .frequency("daily")
                        .timeSlot("evening")
                        .defaultTime("21:45")
                        .reason("Khoa học tâm lý chứng minh lòng biết ơn tăng 25% chỉ số hạnh phúc và giảm lo âu.")
                        .matchLabel("Phù hợp")
                        .categoryCode("mind")
                        .plan7Days(List.of(
                                "Ngày 1-2: Nghĩ trong đầu 1 điều vui nhỏ trong ngày",
                                "Ngày 3-4: Ghi vào điện thoại hoặc sổ 2 điều tích cực",
                                "Ngày 5-7: Đủ 3 điều biết ơn sâu sắc trước khi ngủ"
                        ))
                        .build()
        );

        List<SuggestionResponse> pool = new ArrayList<>(all);
        // Xáo trộn ngẫu nhiên để mỗi lần bấm "Tải thêm" luôn ra các gợi ý mới mẻ
        Collections.shuffle(pool);

        // Lấy 3 gợi ý đầu tiên và gán id duy nhất
        List<SuggestionResponse> selected = new ArrayList<>();
        long now = System.currentTimeMillis();
        for (int i = 0; i < Math.min(3, pool.size()); i++) {
            SuggestionResponse item = pool.get(i);
            selected.add(SuggestionResponse.builder()
                    .id("sug_rot_" + now + "_" + i)
                    .title(item.getTitle())
                    .tag(item.getTag())
                    .frequency(item.getFrequency())
                    .timeSlot(item.getTimeSlot())
                    .defaultTime(item.getDefaultTime())
                    .reason(item.getReason())
                    .matchLabel(item.getMatchLabel())
                    .categoryCode(item.getCategoryCode())
                    .plan7Days(item.getPlan7Days())
                    .build());
        }
        return selected;
    }
}
