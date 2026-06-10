package com.qacollector.controller;

import com.qacollector.dto.*;
import com.qacollector.service.LocalPaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PaymentController {

    private final LocalPaymentService localPaymentService;

    @GetMapping("/config")
    public ApiResponse<PaymentConfigResponse> config() {
        return ApiResponse.ok(localPaymentService.getPaymentConfig());
    }

    @PostMapping("/create")
    public ApiResponse<PaymentCreateResponse> create(@RequestBody PaymentCreateRequest req) {
        return ApiResponse.ok(localPaymentService.createPayment(req));
    }

    @PostMapping("/complete")
    public ApiResponse<PaymentCompleteResponse> complete(
            @RequestBody PaymentCompleteRequest req,
            HttpServletRequest request) {
        req.setClientIpAddress(request.getRemoteAddr());
        req.setClientUserAgent(request.getHeader("User-Agent"));
        return ApiResponse.ok(localPaymentService.completePayment(req));
    }

    @PostMapping("/cancel")
    public ApiResponse<Void> cancel(@RequestBody PaymentCancelRequest req) {
        localPaymentService.cancelPayment(req);
        return ApiResponse.ok(null);
    }
}
