package com.infrawatch.controller;

import com.infrawatch.dto.AuthRequest;
import com.infrawatch.dto.AuthResponse;
import com.infrawatch.dto.ForgotPasswordRequest;
import com.infrawatch.dto.MessageResponse;
import com.infrawatch.dto.RegisterRequest;
import com.infrawatch.entity.Role;
import com.infrawatch.entity.User;
import com.infrawatch.repository.RoleRepository;
import com.infrawatch.repository.UserRepository;
import com.infrawatch.security.CustomUserDetails;
import com.infrawatch.security.JwtUtil;
import com.infrawatch.service.EmailService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.Set;

@RestController
@RequestMapping("/v1/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired AuthenticationManager authenticationManager;
    @Autowired UserRepository userRepository;
    @Autowired RoleRepository roleRepository;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtUtil jwtUtil;
    @Autowired EmailService emailService;

    /**
     * Self-registration is disabled by default. Public registration on a live
     * deployment is a spam and privilege-escalation vector.
     */
    @Value("${app.auth.allow-self-registration:false}")
    private boolean allowSelfRegistration;

    private static final String CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#";

    /**
     * Roles a caller may grant themselves when registering.
     *
     * <p>Previously the role field was taken from the request body and looked up
     * directly, so anyone could POST {@code "role":"ROLE_ADMIN"} and receive an
     * administrator account. Administrative roles are only assignable by an
     * existing administrator through the user-management endpoint.
     */
    private static final Set<String> SELF_SERVICE_ROLES =
            Set.of("ROLE_VIEWER", "ROLE_ANALYST", "ROLE_MONITOR");

    private static final Set<String> ALL_ROLES =
            Set.of("ROLE_VIEWER", "ROLE_ANALYST", "ROLE_MONITOR", "ROLE_PROJECT_MANAGER", "ROLE_ADMIN");

    private String generateTempPassword() {
        SecureRandom rng = new SecureRandom();
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) sb.append(CHARS.charAt(rng.nextInt(CHARS.length())));
        return sb.toString();
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody AuthRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtil.generateToken(authentication);
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String role = userDetails.getAuthorities().iterator().next().getAuthority();
        return ResponseEntity.ok(new AuthResponse(jwt, userDetails.getId(), userDetails.getUsername(), userDetails.getEmail(), role));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest signUpRequest) {
        if (!allowSelfRegistration) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageResponse(
                            "Public registration is disabled. Please contact your administrator for an account."));
        }
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Username is already taken!"));
        }
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
        }

        String requestedRole = signUpRequest.getRole() != null ? signUpRequest.getRole() : "ROLE_VIEWER";
        if (!ALL_ROLES.contains(requestedRole)) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Unknown role '" + requestedRole + "'."));
        }
        if (!SELF_SERVICE_ROLES.contains(requestedRole)) {
            return ResponseEntity.badRequest().body(new MessageResponse(
                    "Error: Role '" + requestedRole + "' cannot be self-assigned. "
                            + "Allowed for self-registration: " + String.join(", ", SELF_SERVICE_ROLES) + "."));
        }

        Role role = roleRepository.findByName(requestedRole)
                .orElseThrow(() -> new RuntimeException(
                        "Error: Role '" + requestedRole + "' is not configured on this system."));

        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setFullName(signUpRequest.getFullName());
        user.setEmail(signUpRequest.getEmail());
        user.setDepartment(signUpRequest.getDepartment());
        user.setIsActive(true);
        user.setRole(role);
        userRepository.save(user);

        try {
            emailService.sendWelcomeEmail(signUpRequest.getEmail(), signUpRequest.getUsername(), signUpRequest.getFullName());
        } catch (Exception e) {
            logger.warn("Welcome email not sent to {}: {}", signUpRequest.getEmail(), e.getMessage());
        }
        return ResponseEntity.ok(new MessageResponse("User registered successfully! You can now log in."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        // Refuse up front when no mail transport is configured. Previously the
        // password was rewritten first and the mail was attempted afterwards,
        // so with mail unconfigured the account was silently locked out: the
        // new password was never delivered to anyone.
        if (!emailService.isConfigured()) {
            logger.warn("Password reset requested but SMTP is not configured; refusing to reset.");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new MessageResponse(
                            "Password reset by email is currently unavailable. Please contact your administrator."));
        }

        return userRepository.findByEmail(request.getEmail())
                .map(user -> {
                    String tempPassword = generateTempPassword();
                    try {
                        emailService.sendPasswordResetEmail(user.getEmail(), user.getUsername(), tempPassword);
                    } catch (Exception e) {
                        // Delivery failed, so the old password must stay valid.
                        logger.error("Password reset email failed for {}: {}", user.getEmail(), e.getMessage());
                        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                                .body(new MessageResponse("Password reset email could not be sent. Please contact your administrator."));
                    }
                    // Only commit the new password once it has actually been sent.
                    user.setPassword(encoder.encode(tempPassword));
                    userRepository.save(user);
                    return ResponseEntity.ok(new MessageResponse(
                            "A temporary password has been sent to " + request.getEmail() + ". Please check your inbox."));
                })
                .orElse(ResponseEntity.ok(new MessageResponse(
                        "If this email is registered, a temporary password will be sent to your inbox.")));
    }
}