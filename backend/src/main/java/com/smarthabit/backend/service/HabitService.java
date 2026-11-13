package com.smarthabit.backend.service;

import com.smarthabit.backend.dto.request.HabitRequest;
import com.smarthabit.backend.entity.Habit;
import com.smarthabit.backend.repository.HabitLogRepository;
import com.smarthabit.backend.repository.HabitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HabitService {

    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;

    public List<Habit> getHabits(String userId, String status) {
        if (status != null && !status.trim().isEmpty()) {
            return habitRepository.findByUserIdAndStatus(userId, status.trim().toLowerCase());
        }
        return habitRepository.findByUserId(userId);
    }

    public Habit getHabitById(String id, String userId) {
        return habitRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thói quen với mã: " + id));
    }

    public Habit createHabit(HabitRequest request, String userId) {
        Habit habit = Habit.builder()
                .userId(userId)
                .title(request.getTitle().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : "")
                .categoryId(request.getCategoryId())
                .categoryCode(request.getCategoryCode() != null ? request.getCategoryCode() : "health")
                .color(request.getColor() != null ? request.getColor() : "#7C5CFC")
                .icon(request.getIcon() != null ? request.getIcon() : "activity")
                .frequency(request.getFrequency() != null ? request.getFrequency() : "daily")
                .daysOfWeek(request.getDaysOfWeek() != null ? request.getDaysOfWeek() : List.of(1, 2, 3, 4, 5, 6, 7))
                .reminderTime(request.getReminderTime() != null ? request.getReminderTime() : "08:00")
                .reminderEnabled(request.getReminderEnabled() != null ? request.getReminderEnabled() : true)
                .timeSlot(request.getTimeSlot() != null ? request.getTimeSlot() : "morning")
                .goalType(request.getGoalType() != null ? request.getGoalType() : "check")
                .targetValue(request.getTargetValue() != null ? request.getTargetValue() : 1)
                .unit(request.getUnit() != null ? request.getUnit() : "lần")
                .status("active")
                .source(request.getSource() != null ? request.getSource() : "manual")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return habitRepository.save(habit);
    }

    public Habit updateHabit(String id, HabitRequest request, String userId) {
        Habit existing = getHabitById(id, userId);

        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
            existing.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            existing.setDescription(request.getDescription().trim());
        }
        if (request.getCategoryId() != null) {
            existing.setCategoryId(request.getCategoryId());
        }
        if (request.getCategoryCode() != null) {
            existing.setCategoryCode(request.getCategoryCode());
        }
        if (request.getColor() != null) {
            existing.setColor(request.getColor());
        }
        if (request.getIcon() != null) {
            existing.setIcon(request.getIcon());
        }
        if (request.getFrequency() != null) {
            existing.setFrequency(request.getFrequency());
        }
        if (request.getDaysOfWeek() != null) {
            existing.setDaysOfWeek(request.getDaysOfWeek());
        }
        if (request.getReminderTime() != null) {
            existing.setReminderTime(request.getReminderTime());
        }
        if (request.getReminderEnabled() != null) {
            existing.setReminderEnabled(request.getReminderEnabled());
        }
        if (request.getTimeSlot() != null) {
            existing.setTimeSlot(request.getTimeSlot());
        }
        if (request.getGoalType() != null) {
            existing.setGoalType(request.getGoalType());
        }
        if (request.getTargetValue() != null) {
            existing.setTargetValue(request.getTargetValue());
        }
        if (request.getUnit() != null) {
            existing.setUnit(request.getUnit());
        }
        if (request.getStatus() != null) {
            existing.setStatus(request.getStatus());
        }

        existing.setUpdatedAt(Instant.now());
        return habitRepository.save(existing);
    }

    public Habit archiveHabit(String id, String userId) {
        Habit existing = getHabitById(id, userId);
        existing.setStatus("archived");
        existing.setArchivedAt(Instant.now());
        existing.setUpdatedAt(Instant.now());
        return habitRepository.save(existing);
    }

    public Habit restoreHabit(String id, String userId) {
        Habit existing = getHabitById(id, userId);
        existing.setStatus("active");
        existing.setArchivedAt(null);
        existing.setUpdatedAt(Instant.now());
        return habitRepository.save(existing);
    }

    public void deleteHabit(String id, String userId) {
        Habit existing = getHabitById(id, userId);
        habitRepository.delete(existing);
        habitLogRepository.deleteByHabitId(id);
    }
}
