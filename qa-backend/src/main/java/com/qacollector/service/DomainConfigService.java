package com.qacollector.service;

import com.qacollector.dto.DomainConfigDTO;
import com.qacollector.entity.DomainConfig;
import com.qacollector.repository.DomainConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DomainConfigService {

    private final DomainConfigRepository repository;

    public List<DomainConfig> listAll() {
        return repository.findAll();
    }

    public Optional<DomainConfig> findByDomain(String domain) {
        return repository.findByDomain(domain);
    }

    public BigDecimal resolvePrice(String host, BigDecimal defaultPrice) {
        if (host == null || host.isBlank()) return defaultPrice;
        String domain = host.split(":")[0]; // strip port
        return repository.findByDomain(domain)
                .map(DomainConfig::getPrice)
                .orElse(defaultPrice);
    }

    public DomainConfig create(DomainConfigDTO dto) {
        if (dto.getDomain() == null || dto.getDomain().isBlank()) {
            throw new IllegalArgumentException("Domain is required");
        }
        if (dto.getPrice() == null || dto.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Price must be greater than 0");
        }
        if (repository.findByDomain(dto.getDomain()).isPresent()) {
            throw new IllegalArgumentException("Domain already exists");
        }
        DomainConfig config = new DomainConfig();
        config.setDomain(dto.getDomain().trim().toLowerCase());
        config.setPrice(dto.getPrice());
        config.setPaypalMode(dto.getPaypalMode() != null ? dto.getPaypalMode() : "sandbox");
        config.setCreatedAt(LocalDateTime.now());
        config.setUpdatedAt(LocalDateTime.now());
        return repository.save(config);
    }

    public DomainConfig update(Long id, DomainConfigDTO dto) {
        DomainConfig config = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Domain config not found"));
        if (dto.getPrice() != null) {
            if (dto.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Price must be greater than 0");
            }
            config.setPrice(dto.getPrice());
        }
        if (dto.getPaypalMode() != null) {
            config.setPaypalMode(dto.getPaypalMode());
        }
        config.setUpdatedAt(LocalDateTime.now());
        return repository.save(config);
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Domain config not found");
        }
        repository.deleteById(id);
    }
}
