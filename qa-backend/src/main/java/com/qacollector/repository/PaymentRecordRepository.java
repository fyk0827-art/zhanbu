package com.qacollector.repository;

import com.qacollector.entity.PaymentRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PaymentRecordRepository extends JpaRepository<PaymentRecord, Long> {
    Optional<PaymentRecord> findByTradeNo(String tradeNo);

    @Query("""
        select p from PaymentRecord p
        where (:status is null or p.status = :status)
          and (
            :keyword is null
            or lower(p.tradeNo) like lower(concat('%', :keyword, '%'))
            or lower(coalesce(p.providerOrderId, '')) like lower(concat('%', :keyword, '%'))
          )
        order by p.createdAt desc
        """)
    Page<PaymentRecord> searchAdmin(
        @Param("status") String status,
        @Param("keyword") String keyword,
        Pageable pageable
    );
}
