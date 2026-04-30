import api from './api';

export function listarBlocos(servicoId, { inicio, fim } = {}) {
  return api.get(`/disponibilidades/servico/${servicoId}/blocos`, {
    params: { inicio, fim },
  });
}

export function listarRegrasSemanais(servicoId) {
  return api.get(`/disponibilidades/servico/${servicoId}/regras`);
}

export function definirDisponibilidadeSemanal(servicoId, regras) {
  return api.put(`/disponibilidades/servico/${servicoId}`, { regras });
}

export function criarAgendamento(payload) {
  return api.post('/agendamentos', payload);
}
