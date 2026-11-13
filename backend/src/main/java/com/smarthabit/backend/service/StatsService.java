package com.smarthabit.backend.service;

import com.smarthabit.backend.dto.response.HabitStatsResponse;
import com.smarthabit.backend.entity.Habit;
import com.smarthabit.backend.entity.HabitLog;
import com.smarthabit.backend.repository.HabitLogRepository;
import com.smarthabit.backend.repository.HabitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;

    public HabitStatsResponse getUserStats(String userId) {
        List<Habit> habits = habitRepository.findByUserId(userId);
        List<Habit> activeHabits = habits.stream()
                .filter(h -> "active".equalsIgnoreCase(h.getStatus()))
                .collect(Collectors.toList());

        List<HabitLog> logs = habitLogRepository.findByUserId(userId);
        List<HabitLog> doneLogs = logs.stream()
                .filter(l -> "done".equalsIgnoreCase(l.getStatus()))
                .collect(Collectors.toList());

        int totalHabits = activeHabits.size();
        int totalCompleted = doneLogs.size();

        // 1. Tính Streak hiện tại
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

        // 2. Tính Streak dài nhất trong 60 ngày
        int longestStreak = 0;
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
        if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
        }

        // 3. Tỉ lệ hoàn thành 30 ngày qua
        LocalDate thirtyDaysAgo = today.minusDays(30);
        List<HabitLog> logs30 = logs.stream()
                .filter(l -> l.getDate() != null && l.getDate().compareTo(thirtyDaysAgo.toString()) >= 0)
                .collect(Collectors.toList());
        long done30 = logs30.stream().filter(l -> "done".equalsIgnoreCase(l.getStatus())).count();
        double completionRate = logs30.isEmpty() ? 0 : Math.round(((double) done30 / logs30.size()) * 100);

        // 4. Tỉ lệ tuần này (từ Thứ 2 đến hôm nay)
        LocalDate monday = today.with(DayOfWeek.MONDAY);
        List<HabitLog> weekLogs = logs.stream()
                .filter(l -> l.getDate() != null && l.getDate().compareTo(monday.toString()) >= 0 && l.getDate().compareTo(today.toString()) <= 0)
                .collect(Collectors.toList());
        long doneWeek = weekLogs.stream().filter(l -> "done".equalsIgnoreCase(l.getStatus())).count();
        double weeklyRate = weekLogs.isEmpty() ? 0 : Math.round(((double) doneWeek / weekLogs.size()) * 100);

        // 5. Thói quen tốt nhất và cần cải thiện
        Map<String, Long> habitDoneCounts = doneLogs.stream()
                .collect(Collectors.groupingBy(HabitLog::getHabitId, Collectors.counting()));

        Habit bestHabit = null;
        Habit worstHabit = null;
        long maxDone = -1;
        long minDone = Long.MAX_VALUE;

        for (Habit h : activeHabits) {
            long count = habitDoneCounts.getOrDefault(h.getId(), 0L);
            if (count > maxDone) {
                maxDone = count;
                bestHabit = h;
            }
            if (count < minDone) {
                minDone = count;
                worstHabit = h;
            }
        }

        // 6. Số ngày hoàn hảo (ngày có số log done >= số thói quen active)
        Map<String, Long> doneCountByDate = doneLogs.stream()
                .collect(Collectors.groupingBy(HabitLog::getDate, Collectors.counting()));
        int perfectDaysCount = 0;
        if (totalHabits > 0) {
            for (Long count : doneCountByDate.values()) {
                if (count >= totalHabits) {
                    perfectDaysCount++;
                }
            }
        }

        return HabitStatsResponse.builder()
                .totalHabits(totalHabits)
                .totalCompleted(totalCompleted)
                .currentStreak(currentStreak)
                .longestStreak(longestStreak)
                .completionRate(completionRate)
                .weeklyRate(weeklyRate)
                .perfectDaysCount(perfectDaysCount)
                .bestHabit(bestHabit)
                .worstHabit(worstHabit)
                .build();
    }
}
