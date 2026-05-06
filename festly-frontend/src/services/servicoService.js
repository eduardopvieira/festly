import api from './api';

export function listarServicos(filtros = {}) {
  const params = {};
  if (filtros.categoria) params.categoria = filtros.categoria;
  if (filtros.precoMax) params.precoMax = filtros.precoMax;
  if (filtros.disponivel !== undefined) params.disponivel = filtros.disponivel;
  return api.get('/catalogo', { params });
}

export function listarServicosPublicos(filtros = {}) {
  const params = {};
  
  if (filtros.nome) params.nome = filtros.nome;
  if (filtros.cidade) params.cidade = filtros.cidade;
  if (filtros.categoria && filtros.categoria !== 'TODOS') params.categoria = filtros.categoria;
  if (filtros.precoMax) params.precoMax = filtros.precoMax;
  if (filtros.disponivel !== undefined) params.disponivel = filtros.disponivel;
  
  return api.get('/public/catalogo', { params });
}

export function listarMeusServicos(usuarioId) {
  return api.get(`/catalogo/usuario/${usuarioId}`);
}

export function criarServico(dados) {
  return api.post('/catalogo', dados);
}

export function deletarServico(id) {
  return api.delete(`/catalogo/${id}`);
}

export function buscarServico(id) {
  return api.get(`/catalogo/${id}`);
}

export function atualizarServico(id, dados) {
  return api.put(`/catalogo/${id}`, dados);
}

export function uploadFoto(servicoId, arquivo) {
  const form = new FormData();
  form.append('arquivo', arquivo);
  return api.post(`/catalogo/${servicoId}/fotos`, form);
}

export function deletarFoto(servicoId, fotoId) {
  return api.delete(`/catalogo/${servicoId}/fotos/${fotoId}`);
}
