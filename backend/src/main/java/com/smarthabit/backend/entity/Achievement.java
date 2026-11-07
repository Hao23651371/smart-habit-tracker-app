package com.smarthabit.backend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "achievements")
public class Achievement {
    @Id
    private String id;

    @Indexed(unique = true)
    private String code; // FIRST_HABIT, STREAK_7...

    private String name;

    private String description;

    private String icon;

    // "start" | "streak" | "total" | "special"
    private String group;

    private AchievementCondition condition;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AchievementCondition {
        // "FIRST_HABIT" | "TOTAL_DONE" | "STREAK" | "PERFECT_DAY" | "PERFECT_WEEK"
        private String type;
        private Integer value;
    }
}
