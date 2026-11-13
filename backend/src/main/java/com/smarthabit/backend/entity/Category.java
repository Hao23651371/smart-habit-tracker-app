package com.smarthabit.backend.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "categories")
@CompoundIndexes({
    @CompoundIndex(name = "user_code_idx", def = "{'code': 1, 'userId': 1}", unique = true)
})
public class Category {
    @Id
    private String id;

    @JsonProperty("_id")
    public String get_id() {
        return id;
    }

    private String userId; // null nếu là default category của hệ thống

    private String name;

    private String code;

    private String icon;

    private String color;

    @Builder.Default
    private boolean isDefault = false;
}
