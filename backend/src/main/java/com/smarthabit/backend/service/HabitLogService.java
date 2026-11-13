package com.smarthabit.backend.service;

import com.smarthabit.backend.dto.request.HabitLogToggleRequest;
import com.smarthabit.backend.dto.response.ToggleLogResponse;
import com.smarthabit.backend.entity.Habit;
import com.smarthabit.backend.entity.HabitLog;
import com.smarthabit.backend.repository.HabitLogRepository;
import com.smarthabit.backend.repository.HabitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class HabitLogService {

    private final HabitLogRepository habitLogRepository;
    private final HabitRepository habitRepository;

    public List<HabitLog> getLogs(String userId, String startDate, String endDate, String date) {
        if (date != null && !date.trim().isEmpty()) {
            return habitLogRepository.findByUserIdAndDate(userId, date.trim());
        }
        if (startDate != null && endDate != null && !startDate.trim().isEmpty() && !endDate.trim().isEmpty()) {
            return habitLogRepository.findByUserIdAndDateBetween(userId, startDate.trim(), endDate.trim());
        }
        return habitLogRepository.findByUserId(userId);
    }

    public ToggleLogResponse toggleHabit(HabitLogToggleRequest request, String userId) {
        String habitId = request.getHabitId();
        Habit habit = habitRepository.findByIdAndUserId(habitId, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thói quen với mã: " + habitId));

        String date = (request.getDate() != null && !request.getDate().trim().isEmpty())
                ? request.getDate().trim()
                : LocalDate.now().toString();

        Optional<HabitLog> existingOpt = habitLogRepository.findByHabitIdAndDate(habitId, date);

        if (existingOpt.isPresent()) {
            HabitLog existing = existingOpt.get();
            if ("done".equalsIgnoreCase(existing.getStatus())) {
                // Bỏ check-in -> xóa log
                habitLogRepository.delete(existing);
                return ToggleLogResponse.builder()
                        .status("undone")
                        .log(null)
                        .build();
            } else {
                // Cập nhật thành done
                existing.setStatus("done");
                existing.setCompletedAt(Instant.now());
                HabitLog updated = habitLogRepository.save(existing);
                return ToggleLogResponse.builder()
                        .status("done")
                        .log(updated)
                        .build();
            }
        } else {
            // Tạo mới log hoàn thành
            HabitLog newLog = HabitLog.builder()
                    .userId(userId)
                    .habitId(habit.getId())
                    .date(date)
                    .status("done")
                    .currentValue(habit.getTargetValue() != null ? habit.getTargetValue() : 1)
                    .completedAt(Instant.now())
                    .loggedAt(Instant.now())
                    .build();

            HabitLog saved = habitLogRepository.save(newLog);
            return ToggleLogResponse.builder()
                    .status("done")
                    .log(saved)
                    .build();
        }
    }

    public void deleteLog(String userId, String habitId, String date) {
        habitLogRepository.findByHabitIdAndDate(habitId, date)
                .ifPresent(log -> {
                    if (userId.equals(log.getUserId())) {
                        habitLogRepository.delete(log);
                    }
                });
    }
}
