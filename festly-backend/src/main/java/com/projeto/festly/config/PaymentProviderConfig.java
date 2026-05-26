package com.projeto.festly.config;

import com.projeto.festly.service.payment.PaymentProvider;
import com.projeto.festly.service.payment.asaas.AsaasHttpClient;
import com.projeto.festly.service.payment.asaas.AsaasPaymentProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PaymentProviderConfig {

    @Bean
    @ConditionalOnProperty(name = "payment.provider", havingValue = "asaas", matchIfMissing = true)
    public PaymentProvider asaasProvider(AsaasHttpClient http) {
        return new AsaasPaymentProvider(http);
    }
}
