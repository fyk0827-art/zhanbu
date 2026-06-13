package com.qacollector.controller;

import com.qacollector.dto.ApiResponse;
import com.qacollector.dto.DomainConfigDTO;
import com.qacollector.entity.DomainConfig;
import com.qacollector.service.DomainConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/domain-configs")
@RequiredArgsConstructor
public class AdminDomainConfigController {

    private final DomainConfigService domainConfigService;

    @GetMapping
    public ApiResponse<List<DomainConfig>> list() {
        return ApiResponse.ok(domainConfigService.listAll());
    }

    @PostMapping
    public ApiResponse<DomainConfig> create(@RequestBody DomainConfigDTO dto) {
        return ApiResponse.ok(domainConfigService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<DomainConfig> update(@PathVariable Long id, @RequestBody DomainConfigDTO dto) {
        return ApiResponse.ok(domainConfigService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        domainConfigService.delete(id);
        return ApiResponse.ok(null);
    }
}
