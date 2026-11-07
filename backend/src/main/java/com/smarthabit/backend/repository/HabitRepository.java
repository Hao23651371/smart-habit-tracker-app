package com.smarthabit.backend.repository;

import com.smarthabit.backend.entity.Habit;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HabitRepository extends MongoRepository<Habit, String> {
    List<Habit> findByUserIdAndStatus(String userId, String status);
    List<Habit> findByUserId(String userId);
    long countByUserId(String userId);
}
