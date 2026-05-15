import api from './api';

export function getCarrinho(usuarioId) {
  return api.get(`/carrinho/${usuarioId}`);
}

/** Adiciona um intervalo ao carrinho. numeroPessoas é opcional (apenas POR_PESSOA). */
export function adicionarServico(usuarioId, servicoId, inicio, fim, numeroPessoas) {
  return api.post(`/carrinho/${usuarioId}/servicos/${servicoId}`, { inicio, fim, numeroPessoas });
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

export const finalizarCompra = (usuarioId) => api.post(`/carrinho/${usuarioId}/checkout`);
