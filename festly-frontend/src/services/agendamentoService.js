import api from './api';

export async function buscarDatasOcupadas(servicoId) {
  // retorna um array de strings no formato YYYY-MM-DD
  return api.get(`/agendamentos/servico/${servicoId}/ocupados`);
}

export async function criarAgendamento(payload) {
  return api.post('/agendamentos', payload);
}