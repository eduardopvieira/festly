import api from './api';

/** Cria a cobrança a partir do carrinho do cliente autenticado.
 *  payload: { metodo: 'PIX' | 'CARTAO_CREDITO', cartao?: {...}|null } */
export function criarCheckout(payload) {
  return api.post('/pagamentos/checkout', payload);
}

export function buscarPagamento(id) {
  return api.get(`/pagamentos/${id}`);
}

export function listarMeusPagamentos({ page = 0, size = 10 } = {}) {
  return api.get('/pagamentos/meus', { params: { page, size } });
}
