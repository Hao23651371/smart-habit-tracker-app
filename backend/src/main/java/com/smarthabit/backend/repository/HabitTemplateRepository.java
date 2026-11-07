package com.smarthabit.backend.repository;

import com.smarthabit.backend.entity.HabitTemplate;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HabitTemplateRepository extends MongoRepository<HabitTemplate, String> {
    List<HabitTemplate> findByCategoryCode(String categoryCode);
}
