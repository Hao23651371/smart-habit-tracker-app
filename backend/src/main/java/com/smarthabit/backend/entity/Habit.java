package com.smarthabit.backend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "habits")
@CompoundIndexes({
    @CompoundIndex(name = "user_status_idx", def = "{'userId': 1, 'status': 1}")
})
public class Habit {
    @Id
    private String id;

    private String userId;

    private String title;

    private String description;

    private String categoryCode;

    private String color;

    private String icon;

    // "daily" | "weekly"
    private String frequency;

    // "check" | "count" | "duration"
    private String goalType;

    // Ví dụ: mục tiêu 2000 (ml), 30 (phút), hoặc 1 (lần)
    @Builder.Default
    private Integer targetValue = 1;

    private String unit;

    // "active" | "archived"
    @Builder.Default
    private String status = "active";

    // "morning" | "noon" | "afternoon" | "evening" | null
    private String timeSlot;

    // Giờ nhắc nhở, ví dụ "07:30"
    private String reminderTime;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
