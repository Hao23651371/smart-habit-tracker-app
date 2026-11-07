package com.smarthabit.backend.repository;

import com.smarthabit.backend.entity.Category;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends MongoRepository<Category, String> {
    List<Category> findByUserIdOrIsDefaultTrue(String userId);
    Optional<Category> findByCode(String code);
}
