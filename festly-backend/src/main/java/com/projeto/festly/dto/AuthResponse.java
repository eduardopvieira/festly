package com.projeto.festly.dto;

import com.projeto.festly.entity.TipoUsuario;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Long id;
    private String nome;
    private String email;
    private TipoUsuario tipo;
}
