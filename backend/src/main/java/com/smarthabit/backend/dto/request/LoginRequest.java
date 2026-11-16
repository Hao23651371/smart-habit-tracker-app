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
public class LoginRequest {
    @NotBlank(message = "Vui lòng nhập email hoặc tên đăng nhập")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;
}
