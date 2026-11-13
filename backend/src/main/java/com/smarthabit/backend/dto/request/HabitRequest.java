package com.smarthabit.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HabitRequest {
    @NotBlank(message = "Tên thói quen không được để trống")
    private String title;

    private String description;

    private String categoryId;

    private String categoryCode;

    private String color;

    private String icon;

    private String frequency;

    private List<Integer> daysOfWeek;

    private String reminderTime;

    private Boolean reminderEnabled;

    private String timeSlot;

    private String goalType;

    private Integer targetValue;

    private String unit;

    private String status;

    private String source;
}
