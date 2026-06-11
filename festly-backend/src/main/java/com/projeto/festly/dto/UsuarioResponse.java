package com.projeto.festly.dto;

import com.projeto.festly.entity.TipoUsuario;
import com.projeto.festly.entity.Usuario;
import lombok.Data;

@Data
public class UsuarioResponse {
    private Long id;
    private String nome;
    private String email;
    private TipoUsuario tipoUsuario;

    public static UsuarioResponse from(Usuario usuario) {
        UsuarioResponse r = new UsuarioResponse();
        r.setId(usuario.getId());
        r.setNome(usuario.getNome());
        r.setEmail(usuario.getEmail());
        r.setTipoUsuario(usuario.getTipoUsuario());
        return r;
    }
}
