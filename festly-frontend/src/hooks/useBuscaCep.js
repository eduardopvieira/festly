import { useRef, useState, useCallback } from 'react';
import { buscarCep, soDigitos, CepNaoEncontradoError } from '@/services/cepService';

/**
 * Encapsula a busca de CEP com estado de loading/erro e proteção contra
 * respostas obsoletas. O form passa um onSuccess(endereco) para preencher
 * seus próprios campos.
 */
export function useBuscaCep() {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const versaoRef = useRef(0);

  const buscar = useCallback(async (cep, onSuccess) => {
    const digitos = soDigitos(cep);
    if (digitos.length !== 8) return; // só dispara com 8 dígitos

    const versao = ++versaoRef.current;
    setLoading(true);
    setErro('');
    try {
      const endereco = await buscarCep(digitos);
      if (versao !== versaoRef.current) return; // resposta obsoleta
      onSuccess(endereco);
    } catch (e) {
      if (versao !== versaoRef.current) return;
      setErro(
        e instanceof CepNaoEncontradoError
          ? 'CEP não encontrado.'
          : 'Não foi possível buscar o CEP. Preencha manualmente.'
      );
    } finally {
      if (versao === versaoRef.current) setLoading(false);
    }
  }, []);

  return { buscar, loading, erro };
}
