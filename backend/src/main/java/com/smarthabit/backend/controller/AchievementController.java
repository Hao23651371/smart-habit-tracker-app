package com.smarthabit.backend.controller;

import com.smarthabit.backend.entity.Achievement;
import com.smarthabit.backend.entity.User;
import com.smarthabit.backend.entity.UserAchievement;
import com.smarthabit.backend.service.AchievementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;

    @GetMapping("/achievements")
    public ResponseEntity<List<Achievement>> getAllAchievements() {
        return ResponseEntity.ok(achievementService.getAllAchievements());
    }

    @GetMapping("/user-achievements")
    public ResponseEntity<List<UserAchievement>> getUserAchievements(@AuthenticationPrincipal User currentUser) {
        String userId = currentUser != null ? currentUser.getId() : "usr_default";
        return ResponseEntity.ok(achievementService.getUserAchievements(userId));
    }
}
