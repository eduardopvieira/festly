import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listarBlocos } from '../services/agendamentoService';
import { toast } from 'sonner';

const HORIZONTE_DIAS = 60;
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatarISO(data) {
  return data.toISOString().slice(0, 10);
}

function inicioDaSemana(data) {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function adicionarDias(data, dias) {
  const d = new Date(data);
  d.setDate(d.getDate() + dias);
  return d;
}

function chaveBloco(bloco) {
  return `${bloco.data}|${bloco.hora}`;
}

function rotuloHora(hora) {
  return hora?.slice(0, 5);
}

export default function CalendarioBlocos({
  servicoId,
  selecionados = [],
  onToggleBloco,
  onRemoverMeu,
  refreshKey = 0,
}) {
  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const limite = useMemo(() => adicionarDias(hoje, HORIZONTE_DIAS), [hoje]);

  const [referenciaSemana, setReferenciaSemana] = useState(() => inicioDaSemana(hoje));
  const [blocos, setBlocos] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const fimSemana = adicionarDias(referenciaSemana, 6);

  useEffect(() => {
    setCarregando(true);
    listarBlocos(servicoId, {
      inicio: formatarISO(referenciaSemana),
      fim: formatarISO(fimSemana),
    })
      .then(({ data }) => setBlocos(data))
      .catch(() => toast.error('Erro ao carregar agenda'))
      .finally(() => setCarregando(false));
  }, [servicoId, referenciaSemana.getTime(), refreshKey]);

  const dias = useMemo(() => {
    const lista = [];
    for (let i = 0; i < 7; i += 1) {
      lista.push(adicionarDias(referenciaSemana, i));
    }
    return lista;
  }, [referenciaSemana]);

  const blocosPorDia = useMemo(() => {
    const map = new Map();
    for (const bloco of blocos) {
      const lista = map.get(bloco.data) ?? [];
      lista.push(bloco);
      map.set(bloco.data, lista);
    }
    return map;
  }, [blocos]);

  const selecionadosSet = useMemo(
    () => new Set(selecionados.map(chaveBloco)),
    [selecionados]
  );

  function semanaAnterior() {
    const nova = adicionarDias(referenciaSemana, -7);
    if (adicionarDias(nova, 6) < hoje) return;
    setReferenciaSemana(nova);
  }

  function proximaSemana() {
    const nova = adicionarDias(referenciaSemana, 7);
    if (nova > limite) return;
    setReferenciaSemana(nova);
  }

  const podeVoltar =
    adicionarDias(referenciaSemana, -7).getTime() + 6 * 86400000 >= hoje.getTime();
  const podeAvancar = adicionarDias(referenciaSemana, 7).getTime() <= limite.getTime();

  function handleClick(bloco) {
    if (bloco.status === 'DISPONIVEL') {
      onToggleBloco?.(bloco);
    } else if (bloco.status === 'MEU') {
      onRemoverMeu?.(bloco);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={semanaAnterior} disabled={!podeVoltar}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {referenciaSemana.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} —{' '}
          {fimSemana.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </span>
        <Button type="button" variant="outline" size="sm" onClick={proximaSemana} disabled={!podeAvancar}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Disponível
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Selecionado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-violet-500" /> No seu carrinho
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" /> Indisponível
        </span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dias.map((dia) => {
          const iso = formatarISO(dia);
          const blocosDoDia = blocosPorDia.get(iso) ?? [];
          const ehHoje = dia.getTime() === hoje.getTime();
          const passada = dia < hoje;
          return (
            <div key={iso} className="flex flex-col">
              <div
                className={`text-center text-xs ${
                  ehHoje ? 'text-primary font-semibold' : 'text-muted-foreground'
                }`}
              >
                {DIAS_SEMANA[dia.getDay()]}
                <div className="text-sm text-foreground">{dia.getDate()}</div>
              </div>
              <div className="mt-2 flex flex-col gap-1.5">
                {passada && blocosDoDia.length === 0 && (
                  <div className="h-8 flex items-center justify-center rounded-md border border-dashed text-[11px] text-muted-foreground/70">
                    —
                  </div>
                )}
                {!passada && blocosDoDia.length === 0 && (
                  <div className="h-8 flex items-center justify-center rounded-md border border-dashed px-1 text-[10px] leading-tight text-muted-foreground/70">
                    Fora
                  </div>
                )}
                {blocosDoDia.map((bloco) => {
                  const selecionado = selecionadosSet.has(chaveBloco(bloco));
                  const base =
                    'h-8 inline-flex items-center justify-center rounded-md text-xs leading-none border transition-colors font-medium';
                  let classe = base;
                  if (bloco.status === 'DISPONIVEL') {
                    classe += selecionado
                      ? ' bg-primary text-primary-foreground border-primary cursor-pointer'
                      : ' bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900 cursor-pointer';
                  } else if (bloco.status === 'MEU') {
                    classe +=
                      ' bg-violet-50 hover:bg-violet-100 border-violet-300 text-violet-900 cursor-pointer';
                  } else if (bloco.status === 'RESERVADO') {
                    classe += ' bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed';
                  } else {
                    classe += ' bg-zinc-50 text-zinc-300 border-zinc-100 cursor-not-allowed';
                  }
                  return (
                    <button
                      type="button"
                      key={`${bloco.data}-${bloco.hora}`}
                      className={classe}
                      onClick={() => handleClick(bloco)}
                      disabled={bloco.status === 'RESERVADO' || bloco.status === 'INDISPONIVEL'}
                      title={
                        bloco.status === 'MEU'
                          ? 'Clique para remover do carrinho'
                          : bloco.status === 'DISPONIVEL'
                          ? selecionado
                            ? 'Clique para desmarcar'
                            : 'Clique para selecionar'
                          : 'Indisponível'
                      }
                    >
                      {rotuloHora(bloco.hora)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {carregando && (
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin mr-1" /> Carregando agenda...
        </div>
      )}
    </div>
  );
}
