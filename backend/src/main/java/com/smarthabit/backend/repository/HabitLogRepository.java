package com.smarthabit.backend.repository;

import com.smarthabit.backend.entity.HabitLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HabitLogRepository extends MongoRepository<HabitLog, String> {
    Optional<HabitLog> findByHabitIdAndDate(String habitId, String date);
    List<HabitLog> findByUserIdAndDate(String userId, String date);
    List<HabitLog> findByHabitId(String habitId);
    List<HabitLog> findByUserId(String userId);
    List<HabitLog> findByUserIdAndDateBetween(String userId, String startDate, String endDate);
    long countByUserIdAndStatus(String userId, String status);
    void deleteByHabitId(String habitId);
}
