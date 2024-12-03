package com.shadowshiftstudio.compressionservice.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {
    @GetMapping("/api/public")
    public String getPublicResource() {
        return "This is a public resource. No authentication required.";
    }

    @GetMapping("/api/private")
    public String getPrivateResource() {
        return "This is a private resource. Authentication required.";
    }
}