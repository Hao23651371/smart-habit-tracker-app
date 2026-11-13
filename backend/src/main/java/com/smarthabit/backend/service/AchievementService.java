package com.smarthabit.backend.service;

import com.smarthabit.backend.entity.Achievement;
import com.smarthabit.backend.entity.Habit;
import com.smarthabit.backend.entity.HabitLog;
import com.smarthabit.backend.entity.UserAchievement;
import com.smarthabit.backend.repository.AchievementRepository;
import com.smarthabit.backend.repository.HabitLogRepository;
import com.smarthabit.backend.repository.HabitRepository;
import com.smarthabit.backend.repository.UserAchievementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;

    public List<Achievement> getAllAchievements() {
        return achievementRepository.findAll();
    }

    public List<UserAchievement> getUserAchievements(String userId) {
        evaluateAchievements(userId);
        return userAchievementRepository.findByUserId(userId);
    }

    public void evaluateAchievements(String userId) {
        List<Habit> habits = habitRepository.findByUserId(userId);
        List<HabitLog> logs = habitLogRepository.findByUserId(userId);
        List<HabitLog> doneLogs = logs.stream()
                .filter(l -> "done".equalsIgnoreCase(l.getStatus()))
                .collect(Collectors.toList());

        Set<String> doneDates = doneLogs.stream()
                .map(HabitLog::getDate)
                .collect(Collectors.toSet());

        LocalDate today = LocalDate.now();
        LocalDate cursor = today;
        if (!doneDates.contains(today.toString())) {
            cursor = today.minusDays(1);
        }
        int currentStreak = 0;
        while (doneDates.contains(cursor.toString())) {
            currentStreak++;
            cursor = cursor.minusDays(1);
        }

        int longestStreak = currentStreak;
        int tempStreak = 0;
        for (int i = 59; i >= 0; i--) {
            String dateStr = today.minusDays(i).toString();
            if (doneDates.contains(dateStr)) {
                tempStreak++;
                if (tempStreak > longestStreak) {
                    longestStreak = tempStreak;
                }
            } else {
                tempStreak = 0;
            }
        }

        int maxStreak = Math.max(currentStreak, longestStreak);

        // Tính streak cho thói quen uống nước
        int maxWaterStreak = 0;
        for (Habit h : habits) {
            String title = h.getTitle() != null ? h.getTitle().toLowerCase() : "";
            if (title.contains("nước") || title.contains("nuoc") || "health".equalsIgnoreCase(h.getCategoryCode())) {
                Set<String> hDoneDates = doneLogs.stream()
                        .filter(l -> h.getId().equals(l.getHabitId()))
                        .map(HabitLog::getDate)
                        .collect(Collectors.toSet());
                LocalDate hCursor = today;
                if (!hDoneDates.contains(today.toString())) {
                    hCursor = today.minusDays(1);
                }
                int hStreak = 0;
                while (hDoneDates.contains(hCursor.toString())) {
                    hStreak++;
                    hCursor = hCursor.minusDays(1);
                }
                if (hStreak > maxWaterStreak) {
                    maxWaterStreak = hStreak;
                }
            }
        }

        // Tính streak cho thói quen buổi trưa
        int maxNoonStreak = 0;
        for (Habit h : habits) {
            if ("noon".equalsIgnoreCase(h.getTimeSlot())) {
                Set<String> hDoneDates = doneLogs.stream()
                        .filter(l -> h.getId().equals(l.getHabitId()))
                        .map(HabitLog::getDate)
                        .collect(Collectors.toSet());
                LocalDate hCursor = today;
                if (!hDoneDates.contains(today.toString())) {
                    hCursor = today.minusDays(1);
                }
                int hStreak = 0;
                while (hDoneDates.contains(hCursor.toString())) {
                    hStreak++;
                    hCursor = hCursor.minusDays(1);
                }
                if (hStreak > maxNoonStreak) {
                    maxNoonStreak = hStreak;
                }
            }
        }

        List<Achievement> allAchievements = achievementRepository.findAll();
        for (Achievement ach : allAchievements) {
            boolean eligible = false;
            Achievement.AchievementCondition cond = ach.getCondition();
            if (cond == null) continue;

            String type = cond.getType();
            int val = cond.getValue() != null ? cond.getValue() : 1;

            if ("FIRST_HABIT".equalsIgnoreCase(type)) {
                eligible = habits.size() >= val;
            } else if ("TOTAL_DONE".equalsIgnoreCase(type)) {
                eligible = doneLogs.size() >= val;
            } else if ("STREAK".equalsIgnoreCase(type)) {
                // Ràng buộc streak: Dưới 3 ngày không tính, từ 3 ngày trở đi mới tính
                eligible = maxStreak >= Math.max(3, val);
            } else if ("WATER_STREAK".equalsIgnoreCase(type)) {
                // Ràng buộc chuỗi uống nước
                eligible = maxWaterStreak >= val;
            } else if ("NOON_STREAK".equalsIgnoreCase(type)) {
                eligible = maxNoonStreak >= val;
            } else if ("PERFECT_DAY".equalsIgnoreCase(type)) {
                eligible = doneDates.size() >= val;
            } else if ("PERFECT_WEEK".equalsIgnoreCase(type)) {
                eligible = doneDates.size() >= val;
            }

            if (eligible) {
                if (!userAchievementRepository.existsByUserIdAndAchievementCode(userId, ach.getCode())) {
                    UserAchievement ua = UserAchievement.builder()
                            .userId(userId)
                            .achievementId(ach.getId())
                            .achievementCode(ach.getCode())
                            .unlockedAt(Instant.now())
                            .build();
                    userAchievementRepository.save(ua);
                }
            }
        }
    }
}
