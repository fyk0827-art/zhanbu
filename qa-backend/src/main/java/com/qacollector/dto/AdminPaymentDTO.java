package com.qacollector.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class AdminPaymentDTO {
    private Long id;
    private String tradeNo;
    private Long questionId;
    private Long ageGroupId;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String provider;
    private String providerOrderId;
    private String partnerOrderId;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}
