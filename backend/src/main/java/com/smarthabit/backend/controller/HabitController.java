package com.smarthabit.backend.controller;

import com.smarthabit.backend.dto.request.HabitRequest;
import com.smarthabit.backend.entity.Habit;
import com.smarthabit.backend.entity.User;
import com.smarthabit.backend.service.HabitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/habits")
@RequiredArgsConstructor
public class HabitController {

    private final HabitService habitService;

    @GetMapping
    public ResponseEntity<List<Habit>> getHabits(
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(habitService.getHabits(currentUser.getId(), status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Habit> getHabitById(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(habitService.getHabitById(id, currentUser.getId()));
    }

    @PostMapping
    public ResponseEntity<Habit> createHabit(
            @Valid @RequestBody HabitRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        Habit created = habitService.createHabit(request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Habit> updateHabit(
            @PathVariable String id,
            @Valid @RequestBody HabitRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(habitService.updateHabit(id, request, currentUser.getId()));
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<Habit> archiveHabit(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(habitService.archiveHabit(id, currentUser.getId()));
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<Habit> restoreHabit(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(habitService.restoreHabit(id, currentUser.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHabit(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser
    ) {
        habitService.deleteHabit(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
