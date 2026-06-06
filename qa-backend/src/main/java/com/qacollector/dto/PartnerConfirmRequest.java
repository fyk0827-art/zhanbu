package com.qacollector.dto;

import lombok.Data;

@Data
public class PartnerConfirmRequest {
    /** Partner payment trade number (idempotency key) */
    private String tradeNo;
    /** Amount in cents, e.g. 1900 = $19.00 */
    private Integer amount;
    private String payerContact;
}
