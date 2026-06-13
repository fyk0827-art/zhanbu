package com.qacollector.dto;

import java.math.BigDecimal;

public class DomainConfigDTO {
    private Long id;
    private String domain;
    private BigDecimal price;
    private String paypalMode;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getPaypalMode() { return paypalMode; }
    public void setPaypalMode(String paypalMode) { this.paypalMode = paypalMode; }
}
