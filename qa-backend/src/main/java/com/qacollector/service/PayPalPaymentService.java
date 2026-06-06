package com.qacollector.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qacollector.config.PayPalProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PayPalPaymentService {
    private final PayPalProperties paypalProperties;
    private final ObjectMapper objectMapper;

    public PayPalOrder createOrder(String tradeNo, int amountCents, String currency, String returnUrl, String cancelUrl) {
        ensureConfigured();
        BigDecimal amount = BigDecimal.valueOf(amountCents, 2).setScale(2, RoundingMode.UNNECESSARY);
        Map<String, Object> body = Map.of(
            "intent", "CAPTURE",
            "application_context", Map.of(
                "brand_name", "Q&A Collector",
                "landing_page", "LOGIN",
                "user_action", "PAY_NOW",
                "return_url", returnUrl,
                "cancel_url", cancelUrl
            ),
            "purchase_units", List.of(Map.of(
                "invoice_id", tradeNo,
                "custom_id", tradeNo,
                "description", "Q&A report unlock",
                "amount", Map.of(
                    "currency_code", currency,
                    "value", amount.toPlainString()
                )
            ))
        );

        JsonNode response = client().post()
            .uri(paypalProperties.getApiBaseUrl() + "/v2/checkout/orders")
            .contentType(MediaType.APPLICATION_JSON)
            .header("Authorization", "Bearer " + accessToken())
            .body(body)
            .retrieve()
            .body(JsonNode.class);

        if (response == null || response.path("id").asText("").isBlank()) {
            throw new IllegalStateException("PayPal did not return an order id");
        }
        String approveUrl = "";
        for (JsonNode link : response.path("links")) {
            if ("approve".equalsIgnoreCase(link.path("rel").asText())) {
                approveUrl = link.path("href").asText("");
                break;
            }
        }
        if (approveUrl.isBlank()) {
            throw new IllegalStateException("PayPal did not return an approval url");
        }
        return new PayPalOrder(response.path("id").asText(), approveUrl);
    }

    public void captureOrder(String paypalOrderId) {
        ensureConfigured();
        if (paypalOrderId == null || paypalOrderId.isBlank()) {
            throw new IllegalArgumentException("paypalOrderId is required");
        }

        JsonNode response = client().post()
            .uri(paypalProperties.getApiBaseUrl() + "/v2/checkout/orders/" + paypalOrderId + "/capture")
            .contentType(MediaType.APPLICATION_JSON)
            .header("Authorization", "Bearer " + accessToken())
            .retrieve()
            .body(JsonNode.class);

        String status = response == null ? "" : response.path("status").asText("");
        if (!"COMPLETED".equalsIgnoreCase(status)) {
            throw new IllegalStateException("PayPal capture did not complete");
        }
    }

    private String accessToken() {
        LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");

        JsonNode response = client().post()
            .uri(paypalProperties.getApiBaseUrl() + "/v1/oauth2/token")
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .header("Authorization", basicAuth())
            .body(form)
            .retrieve()
            .body(JsonNode.class);

        if (response == null || response.path("access_token").asText("").isBlank()) {
            throw new IllegalStateException("PayPal did not return an access token");
        }
        return response.path("access_token").asText();
    }

    private String basicAuth() {
        String raw = paypalProperties.getClientId() + ":" + paypalProperties.getClientSecret();
        return "Basic " + Base64.getEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    private RestClient client() {
        return RestClient.builder().messageConverters(converters -> {
            converters.removeIf(converter -> converter.getClass().getName().contains("MappingJackson2"));
            converters.add(new org.springframework.http.converter.json.MappingJackson2HttpMessageConverter(objectMapper));
        }).build();
    }

    private void ensureConfigured() {
        if (paypalProperties.getClientId() == null || paypalProperties.getClientId().isBlank()
            || paypalProperties.getClientSecret() == null || paypalProperties.getClientSecret().isBlank()) {
            throw new IllegalStateException("PayPal client id/secret is not configured");
        }
    }

    public record PayPalOrder(String id, String approveUrl) {
    }
}
