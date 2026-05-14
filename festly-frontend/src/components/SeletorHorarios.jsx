import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Loader2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listarIntervalos } from '../services/agendamentoService';
import { toast } from 'sonner';

const HORIZONTE_DIAS = 90;
const DIAS_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/* ── helpers de data ── */

function inicioDaSemana(d) {
  const base = new Date(d);
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() - base.getDay());
  return base;
}

function inicioDoMes(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function fimDoMes(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addDias(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function addMeses(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function fmtData(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function fmtHoraISO(date) {
  return (
    `${date.getFullYear()}-` +
    `${String(date.getMonth() + 1).padStart(2, '0')}-` +
    `${String(date.getDate()).padStart(2, '0')}T` +
    `${String(date.getHours()).padStart(2, '0')}:` +
    `${String(date.getMinutes()).padStart(2, '0')}:00`
  );
}

function fmtHora(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function parseLocalDT(iso) {
  const [data, hora] = iso.split('T');
  const [y, m, d] = data.split('-').map(Number);
  const [hh, mm] = hora.split(':');
  return new Date(y, m - 1, d, Number(hh), Number(mm), 0);
}

function mesmoDia(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function idxSelecao(inicio, fim, selecoes) {
  return selecoes.findIndex(
    (s) => s.inicio.getTime() === inicio.getTime() && s.fim.getTime() === fim.getTime(),
  );
}

function duracaoStr(inicio, fim) {
  const total = Math.round((fim - inicio) / 60000);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

/* ── BlocoHorario ── */

function BlocoHorario({ bloco, selecionado, onClick }) {
  const { status } = bloco;
  const interativo = status === 'DISPONIVEL' || status === 'MEU';

  const containerClass =
    status === 'DISPONIVEL'
      ? selecionado
        ? 'border-primary bg-primary/10 cursor-pointer'
        : 'border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100 cursor-pointer'
      : status === 'MEU'
        ? 'border-violet-200 bg-violet-50 hover:border-violet-300 cursor-pointer'
        : 'border-border bg-muted/30 opacity-50 cursor-not-allowed';

  const statusLabel =
    status === 'DISPONIVEL'
      ? selecionado ? 'Selecionado' : 'Disponível'
      : status === 'MEU' ? 'No carrinho'
        : 'Reservado';

  const statusClass =
    status === 'DISPONIVEL'
      ? selecionado ? 'text-primary font-semibold' : 'text-emerald-700'
      : status === 'MEU' ? 'text-violet-700'
        : 'text-muted-foreground';

  return (
    <div
      role={interativo ? 'button' : undefined}
      tabIndex={interativo ? 0 : undefined}
      onClick={interativo ? onClick : undefined}
      onKeyDown={interativo ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${containerClass}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">
          {fmtHora(bloco.inicio)} – {fmtHora(bloco.fim)}
        </p>
        <p className="text-xs text-muted-foreground">{duracaoStr(bloco.inicio, bloco.fim)}</p>
      </div>

      <span className={`text-xs shrink-0 ${statusClass}`}>{statusLabel}</span>

      {status === 'DISPONIVEL' && selecionado && (
        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
      {status === 'MEU' && (
        <ShoppingCart className="h-3.5 w-3.5 text-violet-500 shrink-0" />
      )}
    </div>
  );
}

/* ── SeletorHorarios ── */

export default function SeletorHorarios({
  servicoId,
  selecoes = [],
  onAdicionarSelecao,
  onRemoverSelecao,
  onRemoverMeu,
  refreshKey = 0,
}) {
  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const limite = useMemo(() => addDias(hoje, HORIZONTE_DIAS), [hoje]);

  const [viewMode, setViewMode] = useState('semanal');
  const [periodoRef, setPeriodoRef] = useState(() => inicioDaSemana(hoje));
  const [diaSelecionado, setDiaSelecionado] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [intervalos, setIntervalos] = useState([]);
  const [carregando, setCarregando] = useState(false);

  /* período para chamada da API */
  const { periodoInicio, periodoFim } = useMemo(() => {
    if (viewMode === 'semanal') {
      return { periodoInicio: periodoRef, periodoFim: addDias(periodoRef, 6) };
    }
    return { periodoInicio: inicioDoMes(periodoRef), periodoFim: fimDoMes(periodoRef) };
  }, [viewMode, periodoRef]);

  useEffect(() => {
    setCarregando(true);
    listarIntervalos(servicoId, {
      inicio: fmtData(periodoInicio),
      fim: fmtData(periodoFim),
    })
      .then(({ data }) =>
        setIntervalos(
          data.map((it) => ({ inicio: parseLocalDT(it.inicio), fim: parseLocalDT(it.fim), status: it.status })),
        ),
      )
      .catch(() => toast.error('Erro ao carregar agenda'))
      .finally(() => setCarregando(false));
  }, [servicoId, periodoInicio.getTime(), periodoFim.getTime(), refreshKey]);

  /* troca de modo — sincroniza periodoRef */
  function handleViewMode(mode) {
    if (mode === viewMode) return;
    setViewMode(mode);
    setPeriodoRef(mode === 'semanal' ? inicioDaSemana(diaSelecionado) : inicioDoMes(diaSelecionado));
  }

  /* navegação */
  const podeVoltar = viewMode === 'semanal'
    ? addDias(periodoRef, -7).getTime() + 6 * 86400000 >= hoje.getTime()
    : fimDoMes(addMeses(periodoRef, -1)) >= hoje;

  const podeAvancar = viewMode === 'semanal'
    ? addDias(periodoRef, 7).getTime() <= limite.getTime()
    : addMeses(periodoRef, 1).getTime() <= limite.getTime();

  function navAnterior() {
    if (viewMode === 'semanal') {
      const nova = addDias(periodoRef, -7);
      if (addDias(nova, 6) < hoje) return;
      setPeriodoRef(nova);
      setDiaSelecionado(nova < hoje ? hoje : nova);
    } else {
      const nova = addMeses(periodoRef, -1);
      if (fimDoMes(nova) < hoje) return;
      setPeriodoRef(nova);
      const primeiroDia = inicioDoMes(nova);
      setDiaSelecionado(primeiroDia < hoje ? hoje : primeiroDia);
    }
  }

  function navProximo() {
    if (viewMode === 'semanal') {
      const nova = addDias(periodoRef, 7);
      if (nova > limite) return;
      setPeriodoRef(nova);
      setDiaSelecionado(nova);
    } else {
      const nova = addMeses(periodoRef, 1);
      if (nova > limite) return;
      setPeriodoRef(nova);
      setDiaSelecionado(inicioDoMes(nova));
    }
  }

  /* label da navegação */
  const navLabel = viewMode === 'semanal'
    ? `${periodoRef.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — ${addDias(periodoRef, 6).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
    : `${MESES[periodoRef.getMonth()]} ${periodoRef.getFullYear()}`;

  /* dias da semana (view semanal) */
  const diasSemana = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDias(periodoRef, i)),
    [periodoRef],
  );

  /* células do mês (view mensal) */
  const diasMes = useMemo(() => {
    if (viewMode !== 'mensal') return [];
    const primeiro = inicioDoMes(periodoRef);
    const ultimo = fimDoMes(periodoRef);
    const cells = Array.from({ length: primeiro.getDay() }, () => null);
    for (let d = new Date(primeiro); d <= ultimo; d.setDate(d.getDate() + 1)) {
      cells.push(new Date(d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMode, periodoRef]);

  /* disponibilidade por dia */
  const disponiveisPorDia = useMemo(() => {
    const map = {};
    intervalos
      .filter((it) => it.status === 'DISPONIVEL' || it.status === 'MEU')
      .forEach((it) => { map[fmtData(it.inicio)] = (map[fmtData(it.inicio)] || 0) + 1; });
    return map;
  }, [intervalos]);

  /* blocos do dia selecionado */
  const blocosDoDia = useMemo(
    () =>
      intervalos
        .filter((it) => mesmoDia(it.inicio, diaSelecionado) && it.status !== 'INDISPONIVEL')
        .sort((a, b) => a.inicio - b.inicio),
    [intervalos, diaSelecionado],
  );

  function handleBlocoClick(bloco) {
    if (bloco.status === 'MEU') { onRemoverMeu?.({ inicio: bloco.inicio, fim: bloco.fim }); return; }
    const idx = idxSelecao(bloco.inicio, bloco.fim, selecoes);
    if (idx >= 0) onRemoverSelecao?.(idx);
    else onAdicionarSelecao?.(bloco.inicio, bloco.fim);
  }

  /* render helpers */
  function DiaBtn({ dia, ehSelecionado, isPast, ehHoje }) {
    const temDisponivel = !!disponiveisPorDia[fmtData(dia)];
    return (
      <button
        onClick={() => !isPast && setDiaSelecionado(dia)}
        disabled={isPast}
        className={[
          'flex flex-col items-center rounded-lg py-1 transition-colors',
          ehSelecionado ? 'bg-primary text-primary-foreground'
            : isPast ? 'text-muted-foreground/30 cursor-not-allowed'
              : ehHoje ? 'text-primary hover:bg-muted'
                : 'hover:bg-muted',
        ].join(' ')}
      >
        <span className="text-xs font-bold leading-none mt-0.5">{dia.getDate()}</span>
        <span className={[
          'mt-1 h-1 w-1 rounded-full',
          ehSelecionado ? 'bg-primary-foreground/50' : temDisponivel ? 'bg-emerald-500' : 'bg-transparent',
        ].join(' ')} />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4 select-none h-full">
      {/* ── Cabeçalho: toggle + navegação ── */}
      <div className="flex items-center justify-between gap-3 shrink-0">
        {/* Toggle Semanal / Mensal */}
        <div className="flex rounded-lg border overflow-hidden text-xs font-medium">
          {['semanal', 'mensal'].map((mode) => (
            <button
              key={mode}
              onClick={() => handleViewMode(mode)}
              className={[
                'px-3 py-1.5 transition-colors',
                viewMode === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              ].join(' ')}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* Navegação */}
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0"
            onClick={navAnterior} disabled={!podeVoltar}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs font-medium text-center min-w-[140px]">{navLabel}</span>
          <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0"
            onClick={navProximo} disabled={!podeAvancar}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Calendário ── */}
      <div className="shrink-0">
        {viewMode === 'semanal' && (
          <div className="grid grid-cols-7">
            {diasSemana.map((dia) => {
              const isPast = dia < hoje;
              const ehHoje = dia.getTime() === hoje.getTime();
              const ehSelecionado = mesmoDia(dia, diaSelecionado);
              return (
                <div key={dia.getTime()} className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] text-muted-foreground">{DIAS_CURTO[dia.getDay()]}</span>
                  <DiaBtn dia={dia} ehSelecionado={ehSelecionado} isPast={isPast} ehHoje={ehHoje} />
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'mensal' && (
          <div>
            <div className="grid grid-cols-7 mb-1">
              {DIAS_CURTO.map((d) => (
                <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-0.5">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5">
              {diasMes.map((dia, i) => {
                if (!dia) return <div key={`empty-${i}`} />;
                const isPast = dia < hoje;
                const ehHoje = dia.getTime() === hoje.getTime();
                const ehSelecionado = mesmoDia(dia, diaSelecionado);
                return (
                  <DiaBtn key={dia.getTime()} dia={dia} ehSelecionado={ehSelecionado} isPast={isPast} ehHoje={ehHoje} />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Blocos do dia selecionado ── */}
      <div className="border-t pt-3 flex flex-col gap-2 flex-1 min-h-0">
        <p className="text-xs font-medium text-muted-foreground shrink-0">
          {diaSelecionado.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </p>

        {carregando ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando horários…
          </div>
        ) : blocosDoDia.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Sem horários disponíveis neste dia.
          </p>
        ) : (
          <div className="space-y-2 overflow-y-auto flex-1">
            {blocosDoDia.map((bloco, i) => (
              <BlocoHorario
                key={i}
                bloco={bloco}
                selecionado={idxSelecao(bloco.inicio, bloco.fim, selecoes) >= 0}
                onClick={() => handleBlocoClick(bloco)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
