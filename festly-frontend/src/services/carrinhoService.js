import api from './api';

export function getCarrinho(usuarioId) {
  return api.get(`/carrinho/${usuarioId}`);
}

export function adicionarServico(usuarioId, servicoId) {
  return api.post(`/carrinho/${usuarioId}/servicos/${servicoId}`);
}

export function removerServico(usuarioId, servicoId) {
  return api.delete(`/carrinho/${usuarioId}/servicos/${servicoId}`);
}

export function limparCarrinho(usuarioId) {
  return api.delete(`/carrinho/${usuarioId}`);
}
