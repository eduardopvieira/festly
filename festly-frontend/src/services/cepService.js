export class CepInvalidoError extends Error {
  constructor() {
    super('CEP deve ter 8 dígitos.');
    this.name = 'CepInvalidoError';
  }
}

export class CepNaoEncontradoError extends Error {
  constructor() {
    super('CEP não encontrado.');
    this.name = 'CepNaoEncontradoError';
  }
}

/** Remove tudo que não for dígito. */
export function soDigitos(cep) {
  return (cep ?? '').replace(/\D/g, '');
}

/**
 * Busca um CEP no ViaCEP e normaliza o resultado.
 * @returns {Promise<{cep:string, rua:string, bairro:string, cidade:string, estado:string}>}
 */
export async function buscarCep(cep) {
  const digitos = soDigitos(cep);
  if (digitos.length !== 8) throw new CepInvalidoError();

  // Gancho de fallback futuro (BrasilAPI) poderia entrar aqui.
  const resp = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
  if (!resp.ok) throw new Error('Falha ao consultar o CEP.');

  const data = await resp.json();
  if (data.erro) throw new CepNaoEncontradoError();

  return {
    cep: data.cep ?? '',
    rua: data.logradouro ?? '',
    bairro: data.bairro ?? '',
    cidade: data.localidade ?? '',
    estado: data.uf ?? '',
  };
}
