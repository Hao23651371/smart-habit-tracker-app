package com.smarthabit.backend.config;

import com.smarthabit.backend.entity.Habit;
import com.smarthabit.backend.entity.HabitLog;
import com.smarthabit.backend.entity.User;
import com.smarthabit.backend.repository.HabitLogRepository;
import com.smarthabit.backend.repository.HabitRepository;
import com.smarthabit.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        try {
            // 1. Khởi tạo tài khoản mẫu An Nguyễn nếu chưa có
            String sampleEmail = "an.nguyen@example.com";
            User user = userRepository.findByEmail(sampleEmail).orElseGet(() -> {
                User newUser = User.builder()
                        .email(sampleEmail)
                        .password(passwordEncoder.encode("password123"))
                        .fullName("An Nguyễn")
                        .role("ROLE_USER")
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .build();
                User saved = userRepository.save(newUser);
                log.info(">>> [DataInitializer] Đã tự động tạo tài khoản mẫu: {}", sampleEmail);
                return saved;
            });

            // 2. Định nghĩa danh sách 12 thói quen chuẩn: SÁNG (3), TRƯA (4), TỐI (5)
            record HabitTemplate(String title, String description, String icon, String color,
                                 String categoryCode, String reminderTime, String timeSlot,
                                 String goalType, int targetValue, String unit) {}

            List<HabitTemplate> templates = List.of(
                    // --- SÁNG ---
                    new HabitTemplate("Uống 500ml nước ấm sau khi thức dậy", "Khởi động quá trình trao đổi chất buổi sáng", "droplet", "#22C55E", "health", "07:00", "morning", "check", 1, "lần"),
                    new HabitTemplate("Đi bộ nhanh 15 phút", "Vận động nhẹ buổi sáng", "activity", "#0EA5E9", "health", "07:30", "morning", "duration", 15, "phút"),
                    new HabitTemplate("Học 10 từ vựng mới", "Mở rộng vốn từ tiếng Anh", "book-open", "#6366F1", "study", "08:00", "morning", "count", 10, "từ"),

                    // --- TRƯA ---
                    new HabitTemplate("Ăn trưa thanh đạm đúng giờ", "Ăn trưa đúng giờ, nhai kỹ và không dùng điện thoại khi ăn", "coffee", "#F59E0B", "health", "11:45", "noon", "check", 1, "lần"),
                    new HabitTemplate("Uống 1 ly nước ấm sau bữa trưa", "Bổ sung nước sau bữa trưa giúp hỗ trợ tiêu hóa", "droplet", "#22C55E", "health", "12:00", "noon", "check", 1, "lần"),
                    new HabitTemplate("Đi dạo nhẹ 10 phút sau ăn", "Đi lại thư thả giúp cơ thể sảng khoái và hỗ trợ tiêu hóa", "activity", "#0EA5E9", "health", "12:15", "noon", "duration", 10, "phút"),
                    new HabitTemplate("Nghỉ trưa & Chợp mắt 20 phút", "Giấc ngủ ngắn giúp hồi phục năng lượng cho buổi chiều", "moon", "#6366F1", "sleep", "12:30", "noon", "duration", 20, "phút"),

                    // --- TỐI ---
                    new HabitTemplate("Đọc 5 trang sách", "Duy trì thói quen đọc sách mỗi ngày", "book", "#7C5CFC", "study", "20:30", "evening", "check", 1, "lần"),
                    new HabitTemplate("Học bài & Ôn tập 30 phút", "Tập trung ôn bài, làm bài tập hoặc học kỹ năng mới", "book-open", "#7C5CFC", "study", "20:00", "evening", "duration", 30, "phút"),
                    new HabitTemplate("Viết nhật ký & 3 điều biết ơn", "Ghi lại 1 điều học được và 3 điều tích cực trong ngày", "edit-3", "#F59E0B", "mind", "21:15", "evening", "check", 1, "lần"),
                    new HabitTemplate("Thiền buông thư 5 phút", "Thư giãn tâm trí trước khi ngủ", "lotus", "#F59E0B", "mind", "21:30", "evening", "duration", 5, "phút"),
                    new HabitTemplate("Tắt điện thoại trước khi ngủ 30 phút", "Giảm ánh sáng xanh giúp ngủ sâu và đúng giờ", "moon", "#6366F1", "sleep", "22:00", "evening", "check", 1, "lần")
            );

            // Đảm bảo TẤT CẢ các tài khoản user trong hệ thống đều có đủ thói quen Sáng, Trưa và Tối
            List<User> allUsers = userRepository.findAll();
            for (User u : allUsers) {
                // Xoá thói quen cũ không chuẩn nếu có
                habitRepository.findByUserId(u.getId()).stream()
                        .filter(h -> "Uống nước ấm sau khi thức dậy".equals(h.getTitle()))
                        .forEach(habitRepository::delete);

                List<Habit> existingHabits = habitRepository.findByUserId(u.getId());
                List<Habit> toAdd = new ArrayList<>();
                for (HabitTemplate t : templates) {
                    boolean alreadyHas = existingHabits.stream().anyMatch(h -> t.title().equals(h.getTitle()));
                    if (!alreadyHas) {
                        toAdd.add(Habit.builder()
                                .userId(u.getId())
                                .title(t.title())
                                .description(t.description())
                                .icon(t.icon())
                                .color(t.color())
                                .categoryCode(t.categoryCode())
                                .frequency("daily")
                                .daysOfWeek(List.of(1, 2, 3, 4, 5, 6, 7))
                                .reminderTime(t.reminderTime())
                                .reminderEnabled(true)
                                .timeSlot(t.timeSlot())
                                .goalType(t.goalType())
                                .targetValue(t.targetValue())
                                .unit(t.unit())
                                .status("active")
                                .source("manual")
                                .createdAt(Instant.now())
                                .build());
                    }
                }
                if (!toAdd.isEmpty()) {
                    habitRepository.saveAll(toAdd);
                    log.info(">>> [DataInitializer] Đã bổ sung {} thói quen mới (gồm buổi trưa) cho user: {}", toAdd.size(), u.getEmail());
                }
            }

            // 3. Khởi tạo dữ liệu habit_logs 30 ngày gần nhất (chỉ seed khi user demo chưa có log)
            List<Habit> userHabits = habitRepository.findByUserId(user.getId());
            List<HabitLog> existingLogs = habitLogRepository.findByUserId(user.getId());
            if (existingLogs.isEmpty() && !userHabits.isEmpty()) {
                List<HabitLog> logsToSeed = new ArrayList<>();
                LocalDate today = LocalDate.now();

                // 30 ngày gần nhất: daysAgo từ 29 về 1 (ngày hôm nay để trống cho người dùng tự check-in)
                for (int daysAgo = 29; daysAgo >= 0; daysAgo--) {
                    if (daysAgo == 0) {
                        continue;
                    }

                    String dateStr = today.minusDays(daysAgo).toString();

                    for (int hIdx = 0; hIdx < userHabits.size(); hIdx++) {
                        Habit habit = userHabits.get(hIdx);
                        boolean isDone;

                        if (daysAgo == 13 || daysAgo == 19 || daysAgo == 26) {
                            // Ngày nghỉ: ngày thứ 13 tính lùi từ hôm nay (daysAgo = 13) và rải rác ngày 19, 26
                            isDone = false;
                        } else if (daysAgo >= 1 && daysAgo <= 12) {
                            // Chuỗi streak 12 ngày liên tiếp kết thúc hôm qua (daysAgo 1..12):
                            // Ngày 3, 7, 10 hoàn thành phần lớn; các ngày còn lại hoàn thành 100%
                            if (daysAgo == 3 || daysAgo == 7 || daysAgo == 10) {
                                isDone = (hIdx != (daysAgo % userHabits.size()));
                            } else {
                                isDone = true;
                            }
                        } else {
                            // Các ngày cũ hơn (daysAgo 14..29): ngày 15, 22 hoàn thành 100%, các ngày khác hoàn thành phần lớn
                            if (daysAgo == 15 || daysAgo == 22) {
                                isDone = true;
                            } else {
                                isDone = (hIdx != (daysAgo % userHabits.size()));
                            }
                        }

                        HabitLog logItem = HabitLog.builder()
                                .userId(user.getId())
                                .habitId(habit.getId())
                                .date(dateStr)
                                .status(isDone ? "done" : "skipped")
                                .currentValue(isDone ? (habit.getTargetValue() != null ? habit.getTargetValue() : 1) : 0)
                                .note(isDone ? "Đã hoàn thành mục tiêu" : "Chưa hoàn thành")
                                .completedAt(isDone ? Instant.now() : null)
                                .loggedAt(Instant.now())
                                .build();

                        logsToSeed.add(logItem);
                    }
                }

                habitLogRepository.saveAll(logsToSeed);
                log.info(">>> [DataInitializer] Đã seed thành công {} logs 30 ngày cho: {} (Streak 12 ngày, tỉ lệ ~78%)",
                        logsToSeed.size(), sampleEmail);
            }
        } catch (Exception e) {
            log.warn(">>> [DataInitializer] Lỗi khi khởi tạo dữ liệu mẫu: {}", e.getMessage());
        }
    }
}
