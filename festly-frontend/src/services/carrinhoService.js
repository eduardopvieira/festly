import api from './api';

export function getCarrinho(usuarioId) {
  return api.get(`/carrinho/${usuarioId}`);
}

export function adicionarServico(usuarioId, servicoId, dataEvento, horarioEvento) {
  return api.post(`/carrinho/${usuarioId}/servicos/${servicoId}`, { dataEvento, horarioEvento });
}

export function removerServico(usuarioId, servicoId) {
  return api.delete(`/carrinho/${usuarioId}/servicos/${servicoId}`);
}

export function removerSlot(usuarioId, servicoId, dataEvento, horarioEvento) {
  return api.delete(`/carrinho/${usuarioId}/servicos/${servicoId}/slot`, {
    params: { dataEvento, horarioEvento },
  });
}

export function limparCarrinho(usuarioId) {
  return api.delete(`/carrinho/${usuarioId}`);
}

export const finalizarCompra = (usuarioId) => api.post(`/carrinho/${usuarioId}/checkout`);
