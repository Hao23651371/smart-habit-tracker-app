package com.smarthabit.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryRequest {
    @NotBlank(message = "Tên danh mục không được để trống")
    private String name;

    @NotBlank(message = "Mã danh mục không được để trống")
    private String code;

    private String icon;

    private String color;
}
