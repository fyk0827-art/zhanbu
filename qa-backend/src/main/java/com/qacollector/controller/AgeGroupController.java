package com.qacollector.controller;

import com.qacollector.dto.AgeGroupDTO;
import com.qacollector.dto.ApiResponse;
import com.qacollector.dto.SetUnifiedPriceRequest;
import com.qacollector.service.AgeGroupService;
import com.qacollector.service.DomainConfigService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/age-groups")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AgeGroupController {
    private final AgeGroupService ageGroupService;
    private final DomainConfigService domainConfigService;

    @GetMapping
    public ApiResponse<List<AgeGroupDTO>> list(HttpServletRequest request) {
        String host = request.getHeader("Host");
        return ApiResponse.ok(ageGroupService.listAll(host));
    }

    @PutMapping("/admin/price")
    public ApiResponse<Void> setUnifiedPrice(@RequestBody SetUnifiedPriceRequest req) {
        if (req.getPrice() == null || req.getPrice().signum() <= 0) {
            throw new IllegalArgumentException("Price must be greater than 0");
        }
        ageGroupService.setUnifiedPrice(req.getPrice());
        return ApiResponse.ok(null);
    }
}
