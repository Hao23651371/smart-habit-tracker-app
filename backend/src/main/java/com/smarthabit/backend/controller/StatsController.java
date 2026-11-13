package com.smarthabit.backend.controller;

import com.smarthabit.backend.dto.response.HabitStatsResponse;
import com.smarthabit.backend.entity.User;
import com.smarthabit.backend.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping
    public ResponseEntity<HabitStatsResponse> getStats(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(statsService.getUserStats(currentUser.getId()));
    }
}
