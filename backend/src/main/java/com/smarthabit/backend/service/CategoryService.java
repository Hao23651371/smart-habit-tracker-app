package com.smarthabit.backend.service;

import com.smarthabit.backend.dto.request.CategoryRequest;
import com.smarthabit.backend.entity.Category;
import com.smarthabit.backend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<Category> getCategories(String userId) {
        return categoryRepository.findByUserIdOrIsDefaultTrue(userId);
    }

    public Category createCategory(CategoryRequest request, String userId) {
        Category category = Category.builder()
                .userId(userId)
                .name(request.getName().trim())
                .code(request.getCode().trim().toLowerCase())
                .icon(request.getIcon() != null ? request.getIcon() : "tag")
                .color(request.getColor() != null ? request.getColor() : "#7C5CFC")
                .isDefault(false)
                .build();

        return categoryRepository.save(category);
    }
}
