package com.smarthabit.backend.entity;

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
@Document(collection = "user_achievements")
@CompoundIndexes({
    @CompoundIndex(name = "user_achievement_unique", def = "{'userId': 1, 'achievementId': 1}", unique = true)
})
public class UserAchievement {
    @Id
    private String id;

    private String userId;

    private String achievementId;

    private String achievementCode;

    @CreatedDate
    private Instant unlockedAt;
}
