package com.smarthabit.backend.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "habit_logs")
@CompoundIndexes({
    @CompoundIndex(name = "habit_date_unique", def = "{'habitId': 1, 'date': 1}", unique = true),
    @CompoundIndex(name = "user_date_idx", def = "{'userId': 1, 'date': 1}")
})
public class HabitLog {
    @Id
    private String id;

    @JsonProperty("_id")
    public String get_id() {
        return id;
    }

    private String userId;

    private String habitId;

    // Định dạng: "YYYY-MM-DD"
    private String date;

    // "done" | "skipped"
    private String status;

    // Giá trị đã đạt được (ví dụ: 1500 / 2000 ml)
    @Builder.Default
    private Integer currentValue = 1;

    private String note;

    private Instant completedAt;

    @CreatedDate
    private Instant loggedAt;
}
