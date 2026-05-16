import api from './api';

export function listarEnderecos(usuarioId) {
  return api.get(`/clientes/${usuarioId}/enderecos`);
}

export function salvarEndereco(usuarioId, dados) {
  return api.post(`/clientes/${usuarioId}/enderecos`, dados);
}

export function removerEndereco(usuarioId, enderecoId) {
  return api.delete(`/clientes/${usuarioId}/enderecos/${enderecoId}`);
}
