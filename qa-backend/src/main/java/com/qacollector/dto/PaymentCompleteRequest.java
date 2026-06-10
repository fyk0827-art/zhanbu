package com.qacollector.dto;

import lombok.Data;

@Data
public class PaymentCompleteRequest {
    private String tradeNo;
    private String paypalOrderId;
    private String fbc;
    private String fbp;
    private String clientIpAddress;
    private String clientUserAgent;
    private String eventSourceUrl;
}
