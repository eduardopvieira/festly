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

export function listarAgendamentosCliente(clienteId, { ativo = true, page = 0, size = 10 } = {}) {
  return api.get(`/agendamentos/cliente/${clienteId}`, { params: { ativo, page, size } });
}

export function cancelarAgendamento(agendamentoId, clienteId) {
  return api.post(`/agendamentos/${agendamentoId}/cancelar`, null, {
    params: { clienteId },
  });
}

export function listarAgendamentosPrestador({ pendente = true, page = 0, size = 10 } = {}) {
  return api.get('/agendamentos/prestador', { params: { pendente, page, size } });
}

export function confirmarAgendamento(id) {
  return api.post(`/agendamentos/${id}/confirmar`);
}

export function rejeitarAgendamento(id) {
  return api.post(`/agendamentos/${id}/rejeitar`);
}
