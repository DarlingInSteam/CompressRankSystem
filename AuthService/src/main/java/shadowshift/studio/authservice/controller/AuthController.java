package shadowshift.studio.authservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import shadowshift.studio.authservice.dto.ChangePasswordRequest;
import shadowshift.studio.authservice.dto.LoginRequest;
import shadowshift.studio.authservice.dto.LoginResponse;
import shadowshift.studio.authservice.dto.UserDto;
import shadowshift.studio.authservice.service.UserService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    /**
     * Authenticate user and return JWT token
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        LoginResponse response = userService.authenticate(loginRequest);
        return ResponseEntity.ok(response);
    }

    /**
     * Change user password
     */
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        
        // Extract user ID from the authenticated principal
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Long userId = Long.parseLong(userDetails.getUsername());
        
        userService.changePassword(userId, request);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Пароль успешно изменен");
        
        return ResponseEntity.ok(response);
    }

    /**
     * Check if password reset is required for the current user
     */
    @GetMapping("/password-reset-required")
    public ResponseEntity<Map<String, Boolean>> checkPasswordResetRequired(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Long userId = Long.parseLong(userDetails.getUsername());
        
        boolean resetRequired = userService.isPasswordResetRequired(userId);
        
        Map<String, Boolean> response = new HashMap<>();
        response.put("resetRequired", resetRequired);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get current user info
     * Метод для получения информации о текущем пользователе (требуется аутентификация)
     */
    @GetMapping("/user/info")
    public ResponseEntity<Map<String, Object>> getCurrentUserInfo(Authentication authentication) {
        Map<String, Object> userInfo = new HashMap<>();
        
        // Если пользователь аутентифицирован
        if (authentication != null && authentication.isAuthenticated()) {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String userIdStr = userDetails.getUsername();
            
            try {
                Long userId = Long.parseLong(userIdStr);
                UserDto user = userService.getUserById(userId);
                
                userInfo.put("id", user.getId());
                userInfo.put("username", user.getUsername());
                userInfo.put("email", user.getEmail());
                userInfo.put("role", user.getRole());
                userInfo.put("firstName", user.getFirstName());
                userInfo.put("lastName", user.getLastName());
                
                return ResponseEntity.ok(userInfo);
            } catch (Exception e) {
                userInfo.put("error", "Ошибка получения данных пользователя: " + e.getMessage());
                return ResponseEntity.status(500).body(userInfo);
            }
        }
        
        // Если пользователь не аутентифицирован
        userInfo.put("error", "Пользователь не аутентифицирован");
        return ResponseEntity.status(401).body(userInfo);
    }
    
    /**
     * Публичный эндпоинт для получения информации о пользователе по ID без аутентификации
     * для внутренних запросов между микросервисами
     */
    @GetMapping("/user/info/public")
    public ResponseEntity<Map<String, Object>> getUserInfoPublic(@RequestParam(name = "userId", required = false) Long userId,
                                                                @RequestParam(name = "username", required = false) String username) {
        Map<String, Object> userInfo = new HashMap<>();
        
        try {
            UserDto user = null;
            
            // Поиск пользователя по ID или по имени пользователя
            if (userId != null) {
                user = userService.getUserById(userId);
            } else if (username != null) {
                user = userService.getUserByUsername(username);
            } else {
                userInfo.put("error", "Необходимо указать userId или username");
                return ResponseEntity.status(400).body(userInfo);
            }
            
            if (user == null) {
                userInfo.put("error", "Пользователь не найден");
                return ResponseEntity.status(404).body(userInfo);
            }
            
            // Возвращаем только базовую информацию без конфиденциальных данных
            userInfo.put("id", user.getId());
            userInfo.put("username", user.getUsername());
            userInfo.put("role", user.getRole());
            
            return ResponseEntity.ok(userInfo);
        } catch (Exception e) {
            userInfo.put("error", "Ошибка при получении информации о пользователе: " + e.getMessage());
            return ResponseEntity.status(500).body(userInfo);
        }
    }
}