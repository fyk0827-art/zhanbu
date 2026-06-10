package com.qacollector.service;

import com.qacollector.dto.*;
import com.qacollector.entity.AgeGroup;
import com.qacollector.entity.PaymentRecord;
import com.qacollector.entity.Question;
import com.qacollector.repository.AgeGroupRepository;
import com.qacollector.repository.PaymentRecordRepository;
import com.qacollector.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LocalPaymentService {

    private final PaymentRecordRepository paymentRepository;
    private final QuestionRepository questionRepository;
    private final AgeGroupRepository ageGroupRepository;
    private final PartnerPaymentService partnerPaymentService;
    private final PayPalPaymentService payPalPaymentService;
    private final FacebookConversionService facebookConversionService;
    private final com.qacollector.config.PayPalProperties payPalProperties;
    private final com.qacollector.config.PartnerProperties partnerProperties;

    public PaymentConfigResponse getPaymentConfig() {
        PaymentConfigResponse res = new PaymentConfigResponse();
        res.setPaypalClientId(payPalProperties.getClientId());
        res.setCurrency("USD");
        res.setAmountCents(partnerProperties.getStandardAmountCents());
        res.setAmountDisplay(amountFromCents(partnerProperties.getStandardAmountCents()).toPlainString());
        return res;
    }

    @Transactional
    public PaymentCreateResponse createPayment(PaymentCreateRequest req) {
        if (req.getQuestionId() == null) {
            throw new IllegalArgumentException("questionId is required");
        }

        Question question = questionRepository.findById(req.getQuestionId())
            .orElseThrow(() -> new IllegalArgumentException("Question not found"));

        AgeGroup ageGroup = ageGroupRepository.findById(question.getAgeGroupId())
            .orElseThrow(() -> new IllegalArgumentException("Age group not found"));

        String tradeNo = "pay_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
        BigDecimal amount = ageGroup.getPrice();
        int amountCents = amountToCents(amount);
        String returnUrl = normalizeReturnUrl(req.getReturnUrl(), tradeNo, "success");
        String cancelUrl = normalizeReturnUrl(req.getCancelUrl(), tradeNo, "cancel");
        PayPalPaymentService.PayPalOrder paypalOrder = payPalPaymentService.createOrder(
            tradeNo,
            amountCents,
            "USD",
            returnUrl,
            cancelUrl
        );

        PaymentRecord payment = new PaymentRecord();
        payment.setTradeNo(tradeNo);
        payment.setQuestionId(question.getId());
        payment.setAgeGroupId(ageGroup.getId());
        payment.setAmount(amount);
        payment.setCurrency("USD");
        payment.setProvider("paypal");
        payment.setProviderOrderId(paypalOrder.id());
        payment.setStatus("pending");
        payment.setCreatedAt(LocalDateTime.now());
        paymentRepository.save(payment);

        PaymentCreateResponse res = new PaymentCreateResponse();
        res.setTradeNo(tradeNo);
        res.setPaypalOrderId(paypalOrder.id());
        res.setApproveUrl(paypalOrder.approveUrl());
        res.setAmount(amount);
        res.setCurrency("USD");
        res.setStatus("pending");
        return res;
    }

    @Transactional
    public PaymentCompleteResponse completePayment(PaymentCompleteRequest req) {
        if (req.getTradeNo() == null || req.getTradeNo().isBlank()) {
            throw new IllegalArgumentException("tradeNo is required");
        }

        PaymentRecord payment = paymentRepository.findByTradeNo(req.getTradeNo())
            .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        if ("completed".equals(payment.getStatus()) && payment.getPartnerFrontendUrl() != null) {
            return toCompleteResponse(payment);
        }

        try {
            if (req.getPaypalOrderId() == null || req.getPaypalOrderId().isBlank()) {
                markFailed(payment);
                throw new IllegalArgumentException("paypalOrderId is required");
            }
            if (!req.getPaypalOrderId().equals(payment.getProviderOrderId())) {
                markFailed(payment);
                throw new IllegalArgumentException("PayPal order does not match this payment");
            }

            payPalPaymentService.captureOrder(req.getPaypalOrderId());

            PartnerConfirmRequest partnerReq = new PartnerConfirmRequest();
            partnerReq.setTradeNo(payment.getTradeNo());
            partnerReq.setAmount(amountToCents(payment.getAmount()));

            PartnerConfirmResponse partnerRes = partnerPaymentService.confirmPayment(partnerReq);
            payment.setStatus("completed");
            payment.setCompletedAt(LocalDateTime.now());
            payment.setPartnerOrderId(partnerRes.getOrderId());
            payment.setPartnerFrontendUrl(partnerRes.getFrontendUrl());
            paymentRepository.save(payment);

            facebookConversionService.firePurchaseEvent(
                payment.getTradeNo(),
                payment.getAmount(),
                payment.getCurrency()
            );

            return toCompleteResponse(payment);
        } catch (RuntimeException ex) {
            markFailed(payment);
            throw ex;
        }
    }

    @Transactional
    public void cancelPayment(PaymentCancelRequest req) {
        if (req.getTradeNo() == null || req.getTradeNo().isBlank()) {
            throw new IllegalArgumentException("tradeNo is required");
        }

        PaymentRecord payment = paymentRepository.findByTradeNo(req.getTradeNo())
            .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        if ("pending".equals(payment.getStatus())) {
            payment.setStatus("cancelled");
            paymentRepository.save(payment);
        }
    }

    private PaymentCompleteResponse toCompleteResponse(PaymentRecord payment) {
        PaymentCompleteResponse res = new PaymentCompleteResponse();
        res.setTradeNo(payment.getTradeNo());
        res.setStatus(payment.getStatus());
        res.setOrderId(payment.getPartnerOrderId());
        res.setFrontendUrl(payment.getPartnerFrontendUrl());
        return res;
    }

    private BigDecimal amountFromCents(int cents) {
        return BigDecimal.valueOf(cents, 2);
    }

    private int amountToCents(BigDecimal amount) {
        if (amount == null) {
            throw new IllegalArgumentException("Payment amount is required");
        }
        int cents = amount.movePointRight(2).setScale(0, RoundingMode.HALF_UP).intValueExact();
        if (cents < 1 || cents > 999999) {
            throw new IllegalArgumentException("Payment amount must be between 1 and 999999 cents");
        }
        return cents;
    }

    private String normalizeReturnUrl(String rawUrl, String tradeNo, String status) {
        String base = rawUrl == null || rawUrl.isBlank() ? "http://127.0.0.1:3001/" : rawUrl;
        String separator = base.contains("?") ? "&" : "?";
        if (base.contains("paypalReturn=")) {
            return base;
        }
        return base + separator + "paypalReturn=" + status + "&tradeNo=" + tradeNo;
    }

    private void markFailed(PaymentRecord payment) {
        if (!"completed".equals(payment.getStatus()) && !"failed".equals(payment.getStatus())) {
            payment.setStatus("failed");
            paymentRepository.save(payment);
        }
    }
}
