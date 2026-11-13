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
public class HabitLogToggleRequest {
    @NotBlank(message = "Mã thói quen không được để trống")
    private String habitId;

    private String date;
}
