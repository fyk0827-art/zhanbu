package com.qacollector.service;

import com.qacollector.dto.AgeGroupDTO;
import com.qacollector.entity.AgeGroup;
import com.qacollector.repository.AgeGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AgeGroupService {
    private final AgeGroupRepository repository;
    private final DomainConfigService domainConfigService;

    public List<AgeGroupDTO> listAll() {
        return listAll(null);
    }

    public List<AgeGroupDTO> listAll(String host) {
        BigDecimal domainPrice = host != null ? domainConfigService.resolvePrice(host, null) : null;
        List<AgeGroup> groups = repository.findAllByOrderBySortOrderAsc();
        List<AgeGroupDTO> result = new ArrayList<>();
        for (AgeGroup g : groups) {
            AgeGroupDTO dto = new AgeGroupDTO();
            dto.setId(g.getId());
            dto.setName(g.getName());
            dto.setMinAge(g.getMinAge());
            dto.setMaxAge(g.getMaxAge());
            dto.setPrice(domainPrice != null ? domainPrice : g.getPrice());
            dto.setSortOrder(g.getSortOrder());
            result.add(dto);
        }
        return result;
    }

    public void setUnifiedPrice(BigDecimal price) {
        List<AgeGroup> groups = repository.findAll();
        for (AgeGroup g : groups) {
            g.setPrice(price);
        }
        repository.saveAll(groups);
    }
}
