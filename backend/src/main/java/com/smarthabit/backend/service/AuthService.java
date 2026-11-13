package com.smarthabit.backend.service;

import com.smarthabit.backend.dto.request.LoginRequest;
import com.smarthabit.backend.dto.request.RegisterRequest;
import com.smarthabit.backend.dto.response.AuthResponse;
import com.smarthabit.backend.entity.User;
import com.smarthabit.backend.repository.UserRepository;
import com.smarthabit.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng!");
        }

        User user = User.builder()
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .role("ROLE_USER")
                .build();

        User savedUser = userRepository.save(user);
        String token = jwtService.generateToken(savedUser.getId(), savedUser.getEmail());

        return AuthResponse.builder()
                .token(token)
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .avatar(savedUser.getAvatar())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email hoặc mật khẩu không chính xác"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Email hoặc mật khẩu không chính xác");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatar(user.getAvatar())
                .build();
    }

    public AuthResponse getProfile(User currentUser) {
        return AuthResponse.builder()
                .userId(currentUser.getId())
                .email(currentUser.getEmail())
                .fullName(currentUser.getFullName())
                .avatar(currentUser.getAvatar())
                .build();
    }

    public void changePassword(User currentUser, com.smarthabit.backend.dto.request.ChangePasswordRequest request) {
        if (currentUser == null) {
            throw new RuntimeException("Vui lòng đăng nhập lại để thực hiện!");
        }
        if (!passwordEncoder.matches(request.getOldPassword(), currentUser.getPassword())) {
            throw new RuntimeException("Mật khẩu hiện tại không chính xác!");
        }
        if (passwordEncoder.matches(request.getNewPassword(), currentUser.getPassword())) {
            throw new RuntimeException("Mật khẩu mới không được trùng với mật khẩu hiện tại!");
        }
        currentUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(currentUser);
    }
}
