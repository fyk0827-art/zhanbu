package com.qacollector.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "facebook")
public class FacebookProperties {
    private String pixelId = "";
    private String accessToken = "";
}
