package com.qacollector.repository;

import com.qacollector.entity.DomainConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DomainConfigRepository extends JpaRepository<DomainConfig, Long> {
    Optional<DomainConfig> findByDomain(String domain);
}
