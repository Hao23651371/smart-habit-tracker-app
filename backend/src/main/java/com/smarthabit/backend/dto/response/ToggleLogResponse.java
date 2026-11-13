package com.smarthabit.backend.dto.response;

import com.smarthabit.backend.entity.HabitLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToggleLogResponse {
    private String status;
    private HabitLog log;
}
