package com.qacollector.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.qacollector.config.FacebookProperties;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FacebookConversionService {

    private static final Logger log = LoggerFactory.getLogger(FacebookConversionService.class);
    private static final String GRAPH_API = "https://graph.facebook.com/v22.0";

    private final FacebookProperties facebookProperties;
    private final ObjectMapper objectMapper;

    public void firePurchaseEvent(String tradeNo, BigDecimal amount, String currency, String fbc, String fbp) {
        String pixelId = facebookProperties.getPixelId();
        String accessToken = facebookProperties.getAccessToken();
        if (pixelId == null || pixelId.isBlank() || accessToken == null || accessToken.isBlank()) {
            log.warn("Facebook pixel ID or access token not configured; skipping Purchase event");
            return;
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            log.warn("Invalid amount {} for Facebook Purchase event; skipping", amount);
            return;
        }

        try {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("event_name", "Purchase");
            data.put("event_time", System.currentTimeMillis() / 1000);
            data.put("event_id", tradeNo);
            data.put("action_source", "website");

            Map<String, Object> userData = new LinkedHashMap<>();
            userData.put("external_id", tradeNo);
            if (fbc != null && !fbc.isBlank()) userData.put("fbc", fbc);
            if (fbp != null && !fbp.isBlank()) userData.put("fbp", fbp);
            data.put("user_data", userData);

            Map<String, Object> customData = new LinkedHashMap<>();
            customData.put("currency", currency != null ? currency : "USD");
            customData.put("value", amount.doubleValue());
            data.put("custom_data", customData);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("data", List.of(data));

            String url = GRAPH_API + "/" + pixelId + "/events?access_token=" + accessToken;

            String json = objectMapper.writeValueAsString(body);
            log.info("Facebook Conversions API request: {}", json);

            RestClient client = RestClient.create();
            String response = client.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .body(json)
                .retrieve()
                .body(String.class);

            log.info("Facebook Conversions API response: {}", response);
        } catch (Exception e) {
            log.error("Failed to fire Facebook Purchase event: {}", e.getMessage(), e);
        }
    }
}
