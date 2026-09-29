package com.infrawatch.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private final JavaMailSender mailSender;

    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Value("${app.mail.from:noreply@infrawatch.ai}")
    private String fromAddress;

    @Value("${app.mail.sender-name:InfraWatch AI}")
    private String senderName;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    public boolean isConfigured() {
        return mailUsername != null && !mailUsername.isBlank();
    }

    public void sendPasswordResetEmail(String toEmail, String username, String newPassword) {
        if (!isConfigured()) {
            // Never log the password itself: on a hosted platform stdout is
            // retained and often visible to anyone who can read the logs.
            throw new IllegalStateException("SMTP is not configured; cannot send password reset email.");
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderName + " <" + fromAddress + ">");
            message.setTo(toEmail);
            message.setSubject("InfraWatch AI - Your Password Has Been Reset");
            message.setText(
                "Dear " + username + ",\n\n" +
                "Your password for the InfraWatch AI Portal has been reset.\n\n" +
                "Your new temporary password is:\n\n" +
                "    " + newPassword + "\n\n" +
                "Please log in and change this password immediately.\n\n" +
                "Login URL: http://localhost:3000/login\n\n" +
                "If you did not request this, please contact your system administrator.\n\n" +
                "Regards,\n" +
                "InfraWatch AI System\n" +
                "Infrastructure Project Monitoring & Early Warning System"
            );
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("[EmailService] Failed to send email: " + e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    public void sendWelcomeEmail(String toEmail, String username, String fullName) {
        if (!isConfigured()) {
            System.out.println("[EmailService] Mail not configured. Would send welcome to: " + toEmail);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderName + " <" + fromAddress + ">");
            message.setTo(toEmail);
            message.setSubject("Welcome to InfraWatch AI - Account Created");
            message.setText(
                "Dear " + fullName + ",\n\n" +
                "Welcome to the InfraWatch AI Portal!\n\n" +
                "Your account has been successfully created.\n\n" +
                "Username: " + username + "\n\n" +
                "You can now log in at: http://localhost:3000/login\n\n" +
                "Regards,\n" +
                "InfraWatch AI System\n" +
                "Infrastructure Project Monitoring & Early Warning System"
            );
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("[EmailService] Failed to send welcome email: " + e.getMessage());
        }
    }
}
