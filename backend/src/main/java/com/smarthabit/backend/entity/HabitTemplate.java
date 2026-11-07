package com.smarthabit.backend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "habit_templates")
@CompoundIndexes({
    @CompoundIndex(name = "category_level_slot_idx", def = "{'categoryCode': 1, 'level': 1, 'timeSlot': 1}")
})
public class HabitTemplate {
    @Id
    private String id;

    private String title;

    private String categoryCode;

    private String tag;

    // "daily" | "weekly"
    private String frequency;

    // "morning" | "noon" | "afternoon" | "evening"
    private String timeSlot;

    private String defaultTime;

    // "gentle" | "moderate" | "challenging"
    private String level;

    private String reason;
}
