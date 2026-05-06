import api from './api';

/** Intervalos contínuos disponíveis (modelo preferencial). */
export function listarIntervalos(servicoId, { inicio, fim } = {}) {
  return api.get(`/disponibilidades/servico/${servicoId}/intervalos`, {
    params: { inicio, fim },
  });
}

/** Visão derivada em blocos de duração fixa (granularidade configurável). */
export function listarBlocos(servicoId, { inicio, fim, duracaoMinutos } = {}) {
  return api.get(`/disponibilidades/servico/${servicoId}/blocos`, {
    params: { inicio, fim, duracaoMinutos },
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

export function listarAgendamentosCliente(clienteId) {
  return api.get(`/agendamentos/cliente/${clienteId}`);
}

export function cancelarAgendamento(agendamentoId, clienteId) {
  return api.post(`/agendamentos/${agendamentoId}/cancelar`, null, {
    params: { clienteId },
  });
}
