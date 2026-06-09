package com.qacollector.service;

import com.qacollector.dto.AdminPaymentDTO;
import com.qacollector.dto.PageDTO;
import com.qacollector.entity.PaymentRecord;
import com.qacollector.repository.PaymentRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminPaymentService {

    private final PaymentRecordRepository paymentRecordRepository;

    public PageDTO<AdminPaymentDTO> listPayments(int page, int pageSize, String status, String keyword) {
        String normalizedStatus = normalize(status);
        String normalizedKeyword = normalize(keyword);

        Page<PaymentRecord> payments = paymentRecordRepository.searchAdmin(
            normalizedStatus,
            normalizedKeyword,
            PageRequest.of(Math.max(page - 1, 0), Math.max(pageSize, 1))
        );

        List<AdminPaymentDTO> items = payments.getContent().stream()
            .map(this::toDto)
            .toList();

        PageDTO<AdminPaymentDTO> result = new PageDTO<>();
        result.setItems(items);
        result.setTotal(payments.getTotalElements());
        result.setPage(page);
        result.setPageSize(pageSize);
        return result;
    }

    private AdminPaymentDTO toDto(PaymentRecord payment) {
        AdminPaymentDTO dto = new AdminPaymentDTO();
        dto.setId(payment.getId());
        dto.setTradeNo(payment.getTradeNo());
        dto.setQuestionId(payment.getQuestionId());
        dto.setAgeGroupId(payment.getAgeGroupId());
        dto.setAmount(payment.getAmount());
        dto.setCurrency(payment.getCurrency());
        dto.setStatus(payment.getStatus());
        dto.setProvider(payment.getProvider());
        dto.setProviderOrderId(payment.getProviderOrderId());
        dto.setPartnerOrderId(payment.getPartnerOrderId());
        dto.setCreatedAt(payment.getCreatedAt());
        dto.setCompletedAt(payment.getCompletedAt());
        return dto;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
