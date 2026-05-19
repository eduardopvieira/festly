import api from './api';

export function criarAvaliacao({ agendamentoId, nota, comentario }) {
  return api.post('/avaliacoes', { agendamentoId, nota, comentario });
}

export function buscarAvaliacaoDoAgendamento(agendamentoId) {
  return api.get(`/avaliacoes/agendamento/${agendamentoId}`);
}

export function listarAvaliacoesDoServico(servicoId, { page = 0, size = 10 } = {}) {
  return api.get(`/avaliacoes/servico/${servicoId}`, { params: { page, size } });
}
