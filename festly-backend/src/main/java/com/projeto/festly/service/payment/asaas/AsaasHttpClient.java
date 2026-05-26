package com.projeto.festly.service.payment.asaas;

import com.projeto.festly.service.payment.PaymentProviderException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class AsaasHttpClient {

    private final RestClient client;

    public AsaasHttpClient(
            @Value("${asaas.api-url}") String baseUrl,
            @Value("${asaas.api-key}") String apiKey) {
        this.client = RestClient.builder()
            .baseUrl(baseUrl)
            .defaultHeader("access_token", apiKey)
            .defaultHeader("User-Agent", "Festly/1.0")
            .build();
    }

    public <Req, Res> Res post(String path, Req body, Class<Res> responseType, String idempotencyKey) {
        try {
            var spec = client.post().uri(path);
            if (idempotencyKey != null) spec = spec.header("idempotency-key", idempotencyKey);
            return spec.body(body)
                .retrieve()
                .onStatus(HttpStatusCode::is5xxServerError, (req, res) -> {
                    throw new PaymentProviderException(
                        "Asaas 5xx em " + path + ": " + res.getStatusCode());
                })
                .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                    throw new PaymentProviderException(
                        "Asaas 4xx em " + path + ": " + res.getStatusCode());
                })
                .body(responseType);
        } catch (PaymentProviderException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentProviderException("Falha rede Asaas: " + path, e);
        }
    }

    public <Res> Res get(String path, Class<Res> responseType) {
        try {
            return client.get().uri(path)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    throw new PaymentProviderException("Asaas erro em " + path + ": " + res.getStatusCode());
                })
                .body(responseType);
        } catch (PaymentProviderException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentProviderException("Falha rede Asaas: " + path, e);
        }
    }
}
