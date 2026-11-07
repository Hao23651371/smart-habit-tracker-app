package com.smarthabit.backend.repository;

import com.smarthabit.backend.entity.UserAchievement;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAchievementRepository extends MongoRepository<UserAchievement, String> {
    List<UserAchievement> findByUserId(String userId);
    Optional<UserAchievement> findByUserIdAndAchievementId(String userId, String achievementId);
    boolean existsByUserIdAndAchievementCode(String userId, String achievementCode);
}
