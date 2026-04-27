import api from './api';

export function getCarrinho(usuarioId) {
  return api.get(`/carrinho/${usuarioId}`);
}

export const adicionarServico = (usuarioId, servicoId, dataEvento) => {
  return api.post(`/carrinho/${usuarioId}/servicos/${servicoId}`, { dataEvento });
};

export function removerServico(usuarioId, servicoId) {
  return api.delete(`/carrinho/${usuarioId}/servicos/${servicoId}`);
}

export function limparCarrinho(usuarioId) {
  return api.delete(`/carrinho/${usuarioId}`);
}

export const finalizarCompra = (usuarioId) => api.post(`/carrinho/${usuarioId}/checkout`);
