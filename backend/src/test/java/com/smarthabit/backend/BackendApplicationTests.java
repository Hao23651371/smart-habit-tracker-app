package com.smarthabit.backend;

import com.smarthabit.backend.dto.response.HabitStatsResponse;
import com.smarthabit.backend.entity.User;
import com.smarthabit.backend.repository.UserRepository;
import com.smarthabit.backend.service.StatsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class BackendApplicationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private StatsService statsService;

    @Test
    void initDefaultUser() {
        if (!userRepository.existsByEmail("an.nguyen@example.com")) {
            User user = User.builder()
                    .email("an.nguyen@example.com")
                    .password(passwordEncoder.encode("password123"))
                    .fullName("An Nguyễn")
                    .role("ROLE_USER")
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            userRepository.save(user);
            System.out.println(">>> ĐÃ TẠO TÀI KHOẢN MẪU THÀNH CÔNG: an.nguyen@example.com");
        }
    }

    @Test
    void verifyStats() {
        User user = userRepository.findByEmail("an.nguyen@example.com").orElse(null);
        assertNotNull(user, "User demo an.nguyen@example.com phải tồn tại");

        HabitStatsResponse stats = statsService.getUserStats(user.getId());
        System.out.println("=== KẾT QUẢ THỐNG KÊ THẬT TỪ STATS SERVICE ===");
        System.out.println("Current Streak : " + stats.getCurrentStreak() + " ngày");
        System.out.println("Longest Streak : " + stats.getLongestStreak() + " ngày");
        System.out.println("Completion Rate: " + stats.getCompletionRate() + "%");
        System.out.println("Total Habits   : " + stats.getTotalHabits());
        System.out.println("Total Completed: " + stats.getTotalCompleted());

        assertEquals(12, stats.getCurrentStreak(), "Streak hiện tại phải chính xác là 12 ngày");
        assertEquals(78.0, stats.getCompletionRate(), 1.0, "Tỉ lệ hoàn thành 30 ngày phải xấp xỉ 78%");
        assertEquals(5, stats.getTotalHabits(), "Tổng số thói quen active phải là 5");
        assertEquals(117, stats.getTotalCompleted(), "Tổng số lần hoàn thành phải là 117");
    }
}
