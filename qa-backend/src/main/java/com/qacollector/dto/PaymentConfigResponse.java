package com.qacollector.dto;

import lombok.Data;

@Data
public class PaymentConfigResponse {
    private String paypalClientId;
    private String currency;
    private Integer amountCents;
    private String amountDisplay;
}
