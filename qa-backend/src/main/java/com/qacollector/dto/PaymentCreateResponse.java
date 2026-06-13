package com.qacollector.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentCreateResponse {
    private String tradeNo;
    private String paypalOrderId;
    private String approveUrl;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String frontendUrl;
}
