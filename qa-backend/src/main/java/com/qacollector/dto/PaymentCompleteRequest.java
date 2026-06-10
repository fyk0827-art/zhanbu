package com.qacollector.dto;

import lombok.Data;

@Data
public class PaymentCompleteRequest {
    private String tradeNo;
    private String paypalOrderId;
    private String fbc;
    private String fbp;
}
