package com.smarthabit.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuggestionResponse {
    private String id;
    private String title;
    private String tag;
    private String frequency;
    private String timeSlot;
    private String defaultTime;
    private String reason;
    private String matchLabel;
    private String categoryCode;
    private List<String> plan7Days;
}
