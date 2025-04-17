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
}