package com.qacollector.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "paypal")
public class PayPalProperties {
    private String mode = "sandbox";
    private String clientId = "";
    private String clientSecret = "";

    public String getApiBaseUrl() {
        return "live".equalsIgnoreCase(mode)
            ? "https://api-m.paypal.com"
            : "https://api-m.sandbox.paypal.com";
    }
}
