import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listarIntervalos } from '../services/agendamentoService';
import { toast } from 'sonner';

const HORIZONTE_DIAS = 90;
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Escala compacta (~22px/hora): 24h ≈ 360px para caber no modal sem scroll longo
const PIXELS_POR_MINUTO = 0.25;
const ALTURA_DIA = 24 * 60 * PIXELS_POR_MINUTO;
const SNAP_MINUTOS_PADRAO = 30;

function inicioDaSemana(d) {
  const base = new Date(d);
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() - base.getDay());
  return base;
}

function adicionarDias(data, dias) {
  const d = new Date(data);
  d.setDate(d.getDate() + dias);
  return d;
}

function fmtData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function fmtHoraISO(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}:00`;
}

function fmtHora(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function parseLocalDateTime(iso) {
  // Backend devolve "yyyy-MM-ddTHH:mm:ss" sem zona — interpretar como local
  const [data, hora] = iso.split('T');
  const [y, m, d] = data.split('-').map(Number);
  const [hh, mm, ss = '00'] = hora.split(':');
  return new Date(y, m - 1, d, Number(hh), Number(mm), Number(ss));
}

function snapMinutos(minutos, snap) {
  return Math.round(minutos / snap) * snap;
}

/**
 * Recorta um intervalo [inicio,fim] (Date) em segmentos por dia da semana,
 * para renderizar em colunas distintas quando há pernoite.
 * Retorna lista { coluna: 0-6 (idx no array `dias`), inicioMin, fimMin, inicioOriginal, fimOriginal, status }
 */
function dividirEmColunas(intervalo, dias) {
  const segs = [];
  for (let i = 0; i < dias.length; i++) {
    const dia = dias[i];
    const dayStart = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const ini = intervalo.inicio > dayStart ? intervalo.inicio : dayStart;
    const fim = intervalo.fim < dayEnd ? intervalo.fim : dayEnd;
    if (ini < fim) {
      const inicioMin = (ini - dayStart) / 60000;
      const fimMin = (fim - dayStart) / 60000;
      segs.push({
        coluna: i,
        inicioMin,
        fimMin,
        inicioOriginal: intervalo.inicio,
        fimOriginal: intervalo.fim,
        status: intervalo.status,
      });
    }
  }
  return segs;
}

const CORES = {
  DISPONIVEL: 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300 text-emerald-900',
  RESERVADO: 'bg-zinc-200 border-zinc-300 text-zinc-500 cursor-not-allowed',
  INDISPONIVEL: 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed',
  MEU: 'bg-violet-100 hover:bg-violet-200 border-violet-300 text-violet-900',
};

/**
 * @param {object} props
 * @param {number}   props.servicoId
 * @param {Array}    props.selecoes        - {inicio: Date, fim: Date}[]
 * @param {Function} props.onAdicionarSelecao(inicio: Date, fim: Date)
 * @param {Function} props.onRemoverSelecao(idx)
 * @param {Function} props.onRemoverMeu(intervalo: {inicio: Date, fim: Date})
 * @param {number}   props.refreshKey
 * @param {number}   [props.snapMinutos=30]
 */
export default function CalendarioIntervalos({
  servicoId,
  selecoes = [],
  onAdicionarSelecao,
  onRemoverSelecao,
  onRemoverMeu,
  refreshKey = 0,
  snapMinutos: snap = SNAP_MINUTOS_PADRAO,
}) {
  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [referenciaSemana, setReferenciaSemana] = useState(() => inicioDaSemana(hoje));
  const [intervalos, setIntervalos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [arrastando, setArrastando] = useState(null);
  const containerRef = useRef(null);
  const colunasRef = useRef([]);

  const dias = useMemo(() => {
    const lista = [];
    for (let i = 0; i < 7; i += 1) {
      lista.push(adicionarDias(referenciaSemana, i));
    }
    return lista;
  }, [referenciaSemana]);

  const fimSemana = adicionarDias(referenciaSemana, 6);

  useEffect(() => {
    setCarregando(true);
    listarIntervalos(servicoId, {
      inicio: fmtData(referenciaSemana),
      fim: fmtData(fimSemana),
    })
      .then(({ data }) => {
        const parsed = data.map((it) => ({
          inicio: parseLocalDateTime(it.inicio),
          fim: parseLocalDateTime(it.fim),
          status: it.status,
        }));
        setIntervalos(parsed);
      })
      .catch(() => toast.error('Erro ao carregar agenda'))
      .finally(() => setCarregando(false));
  }, [servicoId, referenciaSemana.getTime(), refreshKey]);

  const segmentos = useMemo(() => {
    const out = [];
    intervalos.forEach((intervalo) => {
      out.push(...dividirEmColunas(intervalo, dias));
    });
    return out;
  }, [intervalos, dias]);

  const segmentosSelecao = useMemo(() => {
    const out = [];
    selecoes.forEach((sel, idx) => {
      out.push(
        ...dividirEmColunas({ inicio: sel.inicio, fim: sel.fim, status: 'SELECIONADO' }, dias).map(
          (s) => ({ ...s, idx })
        )
      );
    });
    return out;
  }, [selecoes, dias]);

  const limite = useMemo(() => adicionarDias(hoje, HORIZONTE_DIAS), [hoje]);
  const podeVoltar = adicionarDias(referenciaSemana, -7).getTime() + 6 * 86400000 >= hoje.getTime();
  const podeAvancar = adicionarDias(referenciaSemana, 7).getTime() <= limite.getTime();

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

  function pixelParaDate(diaIdx, pixelY) {
    const minutos = snapMinutos(Math.max(0, Math.min(24 * 60, pixelY / PIXELS_POR_MINUTO)), snap);
    const dia = dias[diaIdx];
    const d = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
    d.setMinutes(minutos);
    return d;
  }

  function dateValido(d) {
    return d > new Date();
  }

  /** Encontra o intervalo DISPONIVEL/MEU que contém este ponto. */
  function intervaloEm(diaIdx, date) {
    return intervalos.find((it) => it.inicio <= date && date < it.fim);
  }

  function onMouseDown(diaIdx, e) {
    const colEl = colunasRef.current[diaIdx];
    if (!colEl) return;
    const rect = colEl.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const inicio = pixelParaDate(diaIdx, y);
    const intervalo = intervaloEm(diaIdx, inicio);

    if (!intervalo) return;
    if (intervalo.status === 'RESERVADO' || intervalo.status === 'INDISPONIVEL') return;

    if (intervalo.status === 'MEU') {
      onRemoverMeu?.({ inicio: intervalo.inicio, fim: intervalo.fim });
      return;
    }

    if (!dateValido(inicio)) return;
    setArrastando({ diaIdx, inicio, fim: inicio, intervalo });
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!arrastando) return;
    const colEl = colunasRef.current[arrastando.diaIdx];
    if (!colEl) return;
    const rect = colEl.getBoundingClientRect();
    const y = e.clientY - rect.top;
    let fim = pixelParaDate(arrastando.diaIdx, y);
    if (fim <= arrastando.inicio) {
      fim = new Date(arrastando.inicio.getTime() + snap * 60000);
    }
    if (fim > arrastando.intervalo.fim) fim = new Date(arrastando.intervalo.fim);
    setArrastando((prev) => prev && { ...prev, fim });
  }

  function onMouseUp() {
    if (!arrastando) return;
    const { inicio, fim, intervalo } = arrastando;
    let fimFinal = fim;
    if (fimFinal <= inicio) fimFinal = new Date(inicio.getTime() + snap * 60000);
    if (fimFinal > intervalo.fim) fimFinal = new Date(intervalo.fim);
    if (fimFinal > inicio) {
      onAdicionarSelecao?.(inicio, fimFinal, intervalo);
    }
    setArrastando(null);
  }

  useEffect(() => {
    const up = () => onMouseUp();
    const move = (e) => onMouseMove(e);
    if (arrastando) {
      window.addEventListener('mouseup', up);
      window.addEventListener('mousemove', move);
      return () => {
        window.removeEventListener('mouseup', up);
        window.removeEventListener('mousemove', move);
      };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrastando]);

  const segmentosArrastando = arrastando
    ? dividirEmColunas(
        { inicio: arrastando.inicio, fim: arrastando.fim, status: 'ARRASTANDO' },
        dias
      )
    : [];

  return (
    <div className="space-y-2 select-none">
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 shrink-0 p-0"
          onClick={semanaAnterior}
          disabled={!podeVoltar}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="truncate px-1 text-center text-xs font-medium">
          {referenciaSemana.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} —{' '}
          {fimSemana.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 shrink-0 p-0"
          onClick={proximaSemana}
          disabled={!podeAvancar}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] leading-tight text-muted-foreground">
        <Legenda cor="bg-emerald-300" label="Disponível" />
        <Legenda cor="bg-primary" label="Selecionado" />
        <Legenda cor="bg-violet-300" label="Carrinho" />
        <Legenda cor="bg-zinc-300" label="Reservado" />
      </div>

      <div className="overflow-hidden rounded-md border bg-background">
        <div className="grid grid-cols-[2.25rem_repeat(7,minmax(0,1fr))]" ref={containerRef}>
          <div />
          {dias.map((dia) => {
            const ehHoje = dia.getTime() === hoje.getTime();
            return (
              <div
                key={dia.getTime()}
                className={`border-l py-0.5 text-center text-[10px] leading-tight ${
                  ehHoje ? 'font-semibold text-primary' : 'text-muted-foreground'
                }`}
              >
                <div>{DIAS_SEMANA[dia.getDay()]}</div>
                <div className="text-foreground text-xs font-medium">{dia.getDate()}</div>
              </div>
            );
          })}

          <ColunaHoras />

          {dias.map((dia, diaIdx) => (
            <div
              key={dia.getTime() + '-col'}
              className="relative border-l"
              style={{ height: ALTURA_DIA }}
              ref={(el) => {
                colunasRef.current[diaIdx] = el;
              }}
              onMouseDown={(e) => onMouseDown(diaIdx, e)}
            >
              {/* linhas de 1h */}
              {Array.from({ length: 23 }).map((_, h) => (
                <div
                  key={h}
                  className={`absolute left-0 right-0 border-t ${
                    (h + 1) % 4 === 0 ? 'border-zinc-200/80' : 'border-zinc-100/90'
                  }`}
                  style={{ top: (h + 1) * 60 * PIXELS_POR_MINUTO }}
                />
              ))}

              {segmentos
                .filter((s) => s.coluna === diaIdx)
                .map((s, i) => (
                  <BarraSegmento key={`s-${i}`} seg={s} onRemoverMeu={onRemoverMeu} />
                ))}

              {segmentosSelecao
                .filter((s) => s.coluna === diaIdx)
                .map((s, i) => (
                  <div
                    key={`sel-${i}`}
                    className="absolute left-0.5 right-0.5 cursor-pointer rounded border-2 border-primary bg-primary/30"
                    style={{
                      top: s.inicioMin * PIXELS_POR_MINUTO,
                      height: Math.max(2, (s.fimMin - s.inicioMin) * PIXELS_POR_MINUTO),
                    }}
                    title="Clique para desmarcar"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onRemoverSelecao?.(s.idx);
                    }}
                  >
                    <span className="absolute top-0.5 left-1 text-[9px] font-medium text-primary">
                      {fmtHora(s.inicioOriginal)} – {fmtHora(s.fimOriginal)}
                    </span>
                  </div>
                ))}

              {segmentosArrastando
                .filter((s) => s.coluna === diaIdx)
                .map((s, i) => (
                  <div
                    key={`drag-${i}`}
                    className="pointer-events-none absolute left-0.5 right-0.5 rounded border-2 border-primary bg-primary/40"
                    style={{
                      top: s.inicioMin * PIXELS_POR_MINUTO,
                      height: Math.max(2, (s.fimMin - s.inicioMin) * PIXELS_POR_MINUTO),
                    }}
                  />
                ))}
            </div>
          ))}
        </div>
      </div>

      {carregando && (
        <div className="flex items-center justify-center text-[10px] text-muted-foreground">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Carregando…
        </div>
      )}
      <p className="text-[10px] leading-snug text-muted-foreground">
        Arraste na faixa verde para selecionar; clique na roxa para tirar do carrinho.
      </p>
    </div>
  );
}

function Legenda({ cor, label }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cor}`} /> {label}
    </span>
  );
}

/** Rótulos a cada 2h mantém as 24h legíveis com menos ruído visual. */
function ColunaHoras() {
  const horas = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 23];
  return (
    <div className="relative border-r" style={{ height: ALTURA_DIA }}>
      {horas.map((h) => (
        <div
          key={h}
          className="absolute right-0.5 text-[9px] tabular-nums leading-none text-muted-foreground"
          style={{ top: Math.max(0, h * 60 * PIXELS_POR_MINUTO - 4) }}
        >
          {String(h).padStart(2, '0')}
        </div>
      ))}
    </div>
  );
}

function BarraSegmento({ seg, onRemoverMeu }) {
  const classes = CORES[seg.status] ?? CORES.INDISPONIVEL;
  const isMeu = seg.status === 'MEU';
  const isInterativo = seg.status === 'DISPONIVEL' || seg.status === 'MEU';
  return (
    <div
      className={`absolute left-0.5 right-0.5 overflow-hidden rounded border ${classes} ${
        isInterativo ? 'cursor-pointer' : ''
      } px-1 py-0.5`}
      style={{
        top: seg.inicioMin * PIXELS_POR_MINUTO,
        height: Math.max(2, (seg.fimMin - seg.inicioMin) * PIXELS_POR_MINUTO),
      }}
      title={
        isMeu
          ? `No seu carrinho · ${fmtHora(seg.inicioOriginal)} – ${fmtHora(seg.fimOriginal)}`
          : seg.status === 'DISPONIVEL'
          ? `Arraste para selecionar · ${fmtHora(seg.inicioOriginal)} – ${fmtHora(seg.fimOriginal)}`
          : `Reservado · ${fmtHora(seg.inicioOriginal)} – ${fmtHora(seg.fimOriginal)}`
      }
      onClick={(ev) => {
        if (!isMeu) return;
        ev.stopPropagation();
        onRemoverMeu?.({ inicio: seg.inicioOriginal, fim: seg.fimOriginal });
      }}
    >
      <span className="text-[9px] font-medium leading-tight">
        {fmtHora(seg.inicioOriginal)}
        {seg.fimOriginal.getTime() - seg.inicioOriginal.getTime() > 60 * 60 * 1000
          ? ` – ${fmtHora(seg.fimOriginal)}`
          : ''}
      </span>
    </div>
  );
}

export { fmtHoraISO };
