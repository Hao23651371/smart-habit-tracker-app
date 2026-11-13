package com.smarthabit.backend.dto.response;

import com.smarthabit.backend.entity.Habit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HabitStatsResponse {
    private int totalHabits;
    private int totalCompleted;
    private int currentStreak;
    private int longestStreak;
    private double completionRate;
    private double weeklyRate;
    private int perfectDaysCount;
    private Habit bestHabit;
    private Habit worstHabit;
}
