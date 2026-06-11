ALTER TABLE servicos DROP CONSTRAINT fk_servicos_fornecedor;
ALTER TABLE servicos RENAME COLUMN fornecedor_id TO usuario_id;
ALTER TABLE servicos ADD CONSTRAINT fk_servicos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id);
DROP TABLE fornecedores;
