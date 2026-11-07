package com.smarthabit.backend.controller;

import com.smarthabit.backend.dto.request.LoginRequest;
import com.smarthabit.backend.dto.request.RegisterRequest;
import com.smarthabit.backend.dto.response.ApiResponse;
import com.smarthabit.backend.dto.response.AuthResponse;
import com.smarthabit.backend.entity.User;
import com.smarthabit.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Đăng ký tài khoản thành công!"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Đăng nhập thành công!"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> getProfile(@AuthenticationPrincipal User currentUser) {
        AuthResponse response = authService.getProfile(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(response, "Lấy thông tin tài khoản thành công"));
    }
}
