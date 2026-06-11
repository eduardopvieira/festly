import api from './api';

export function getCarrinho(usuarioId) {
  return api.get(`/carrinho/${usuarioId}`);
}

/** Adiciona um intervalo ao carrinho. Payload inclui horários, endereço do evento e dados adicionais. */
export function adicionarServico(usuarioId, servicoId, payload) {
  return api.post(`/carrinho/${usuarioId}/servicos/${servicoId}`, payload);
}

export function removerItem(usuarioId, itemId) {
  return api.delete(`/carrinho/${usuarioId}/itens/${itemId}`);
}

export function removerSlot(usuarioId, servicoId, inicio, fim) {
  return api.delete(`/carrinho/${usuarioId}/servicos/${servicoId}/slot`, {
    params: { inicio, fim },
  });
}

export function limparCarrinho(usuarioId) {
  return api.delete(`/carrinho/${usuarioId}`);
}
