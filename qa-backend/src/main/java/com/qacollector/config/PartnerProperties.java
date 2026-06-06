package com.qacollector.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "partner")
public class PartnerProperties {
    /** e.g. http://39.97.224.240:8848 */
    private String apiBaseUrl = "http://39.97.224.240:8848";
    private String webhookSecret = "";
    /** Default prepaid amount in cents. The confirm-payment call uses the actual collected amount. */
    private int standardAmountCents = 1900;
}
