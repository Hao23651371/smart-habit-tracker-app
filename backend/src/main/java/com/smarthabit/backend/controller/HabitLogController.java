package com.smarthabit.backend.controller;

import com.smarthabit.backend.dto.request.HabitLogToggleRequest;
import com.smarthabit.backend.dto.response.ToggleLogResponse;
import com.smarthabit.backend.entity.HabitLog;
import com.smarthabit.backend.entity.User;
import com.smarthabit.backend.service.HabitLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/habit-logs", "/api/logs"})
@RequiredArgsConstructor
public class HabitLogController {

    private final HabitLogService habitLogService;

    @GetMapping
    public ResponseEntity<List<HabitLog>> getLogs(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String date,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(habitLogService.getLogs(currentUser.getId(), startDate, endDate, date));
    }

    @PostMapping("/toggle")
    public ResponseEntity<ToggleLogResponse> toggleHabitCheck(
            @Valid @RequestBody HabitLogToggleRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(habitLogService.toggleHabit(request, currentUser.getId()));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteLog(
            @RequestParam String habitId,
            @RequestParam String date,
            @AuthenticationPrincipal User currentUser
    ) {
        habitLogService.deleteLog(currentUser.getId(), habitId, date);
        return ResponseEntity.noContent().build();
    }
}
