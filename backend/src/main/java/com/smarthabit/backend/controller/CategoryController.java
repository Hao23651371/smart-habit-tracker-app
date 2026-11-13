package com.smarthabit.backend.controller;

import com.smarthabit.backend.dto.request.CategoryRequest;
import com.smarthabit.backend.entity.Category;
import com.smarthabit.backend.entity.User;
import com.smarthabit.backend.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<Category>> getCategories(@AuthenticationPrincipal User currentUser) {
        String userId = currentUser != null ? currentUser.getId() : null;
        return ResponseEntity.ok(categoryService.getCategories(userId));
    }

    @GetMapping("/defaults")
    public ResponseEntity<List<Category>> getDefaultCategories() {
        return ResponseEntity.ok(categoryService.getCategories(null));
    }

    @PostMapping
    public ResponseEntity<Category> createCategory(
            @Valid @RequestBody CategoryRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        Category created = categoryService.createCategory(request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
