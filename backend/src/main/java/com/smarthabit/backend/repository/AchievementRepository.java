package com.smarthabit.backend.repository;

import com.smarthabit.backend.entity.Achievement;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AchievementRepository extends MongoRepository<Achievement, String> {
    Optional<Achievement> findByCode(String code);
}
