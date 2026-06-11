/** Aplica máscara 00000-000, cortando em 8 dígitos. */
export function formatCep(valor) {
  const d = (valor ?? '').replace(/\D/g, '').slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}
