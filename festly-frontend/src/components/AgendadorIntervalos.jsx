import { useState, useEffect, useMemo } from 'react';
import { Plus, X, Loader2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listarIntervalos } from '../services/agendamentoService';
import { toast } from 'sonner';
import CalendarioMes from './CalendarioMes';

const SNAP_MIN = 30;
const HORIZONTE_DIAS = 90;

function fmtData(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseLocalDateTime(iso) {
  const [data, hora] = iso.split('T');
  const [y, mo, d] = data.split('-').map(Number);
  const [hh, mm] = hora.split(':').map(Number);
  return new Date(y, mo - 1, d, hh, mm);
}

function fmtHora(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function fmtBR(date) {
  return date.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function minutosDoHorario(str) {
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

function minutosParaHorario(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function opcoesDeInicio(intervalos) {
  const set = new Set();
  for (const iv of intervalos) {
    if (iv.status !== 'DISPONIVEL') continue;
    const ivIni = iv.inicio.getHours() * 60 + iv.inicio.getMinutes();
    const ivFim = iv.fim.getHours() * 60 + iv.fim.getMinutes();
    for (let cur = ivIni; cur <= ivFim - SNAP_MIN; cur += SNAP_MIN) {
      set.add(minutosParaHorario(cur));
    }
  }
  return [...set].sort();
}

function opcoesDeFim(intervalos, horaInicioStr) {
  const iniMin = minutosDoHorario(horaInicioStr);
  const iv = intervalos.find((iv) => {
    if (iv.status !== 'DISPONIVEL') return false;
    const ivIni = iv.inicio.getHours() * 60 + iv.inicio.getMinutes();
    const ivFim = iv.fim.getHours() * 60 + iv.fim.getMinutes();
    return iniMin >= ivIni && iniMin < ivFim;
  });
  if (!iv) return [];
  const ivFim = iv.fim.getHours() * 60 + iv.fim.getMinutes();
  const options = [];
  for (let cur = iniMin + SNAP_MIN; cur <= ivFim; cur += SNAP_MIN) {
    options.push(minutosParaHorario(cur));
  }
  return options;
}

/**
 * @param {object} props
 * @param {number}   props.servicoId
 * @param {Array}    props.selecoes        - {inicio: Date, fim: Date}[]
 * @param {Function} props.onAdicionarSelecao(inicio: Date, fim: Date)
 * @param {Function} props.onRemoverSelecao(idx)
 * @param {Function} props.onRemoverMeu(intervalo: {inicio: Date, fim: Date})
 * @param {number}   props.refreshKey
 */
export default function AgendadorIntervalos({
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

  const maxDate = useMemo(() => {
    const d = new Date(hoje);
    d.setDate(d.getDate() + HORIZONTE_DIAS);
    return d;
  }, [hoje]);

  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [intervalos, setIntervalos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');

  const dataSelecionadaMs = dataSelecionada?.getTime() ?? 0;

  useEffect(() => {
    if (!dataSelecionadaMs) return;
    const str = fmtData(new Date(dataSelecionadaMs));
    Promise.resolve()
      .then(() => setCarregando(true))
      .then(() => listarIntervalos(servicoId, { inicio: str, fim: str }))
      .then(({ data }) => {
        setHoraInicio('');
        setHoraFim('');
        setIntervalos(
          data.map((it) => ({
            inicio: parseLocalDateTime(it.inicio),
            fim: parseLocalDateTime(it.fim),
            status: it.status,
          }))
        );
      })
      .catch(() => toast.error('Erro ao carregar horários'))
      .finally(() => setCarregando(false));
  }, [servicoId, dataSelecionadaMs, refreshKey]);

  const intervalosDisponiveis = intervalos.filter((iv) => iv.status === 'DISPONIVEL');
  const intervalosMeus = intervalos.filter((iv) => iv.status === 'MEU');

  const inicioOpcoes = opcoesDeInicio(intervalosDisponiveis);
  const fimOpcoes = horaInicio ? opcoesDeFim(intervalosDisponiveis, horaInicio) : [];

  function handleAdicionar() {
    if (!horaInicio || !horaFim || !dataSelecionada) return;
    const [hi, mi] = horaInicio.split(':').map(Number);
    const [hf, mf] = horaFim.split(':').map(Number);
    const inicio = new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), dataSelecionada.getDate(), hi, mi);
    const fim = new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), dataSelecionada.getDate(), hf, mf);
    onAdicionarSelecao?.(inicio, fim);
    setHoraInicio('');
    setHoraFim('');
  }

  function fmtDataLonga(date) {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long',
    });
  }

  return (
    <div className="space-y-4">
      {/* Month calendar */}
      <div className="rounded-lg border p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Escolha uma data
        </p>
        <CalendarioMes
          value={dataSelecionada}
          onChange={setDataSelecionada}
          minDate={hoje}
          maxDate={maxDate}
        />
      </div>

      {/* Time picker for selected date */}
      {dataSelecionada && (
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-semibold capitalize">{fmtDataLonga(dataSelecionada)}</p>

          {carregando ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando horários disponíveis…
            </div>
          ) : intervalosDisponiveis.length === 0 && intervalosMeus.length === 0 ? (
            <p className="text-sm text-muted-foreground py-1">
              Nenhum horário disponível neste dia.
            </p>
          ) : (
            <>
              {intervalosDisponiveis.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Disponível:{' '}
                    {intervalosDisponiveis
                      .map((iv) => `${fmtHora(iv.inicio)} – ${fmtHora(iv.fim)}`)
                      .join(', ')}
                  </p>

                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-muted-foreground">Início</label>
                      <select
                        value={horaInicio}
                        onChange={(e) => {
                          setHoraInicio(e.target.value);
                          setHoraFim('');
                        }}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Selecione</option>
                        {inicioOpcoes.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-muted-foreground">Fim</label>
                      <select
                        value={horaFim}
                        onChange={(e) => setHoraFim(e.target.value)}
                        disabled={!horaInicio}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                      >
                        <option value="">Selecione</option>
                        {fimOpcoes.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAdicionar}
                      disabled={!horaInicio || !horaFim}
                      className="gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              )}

              {intervalosMeus.length > 0 && (
                <div className="pt-3 border-t space-y-2">
                  <p className="text-xs font-medium text-violet-700 flex items-center gap-1.5">
                    <ShoppingCart className="h-3 w-3" />
                    Já no carrinho neste dia
                  </p>
                  {intervalosMeus.map((iv, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-md bg-violet-50 border border-violet-200 px-3 py-2 text-sm"
                    >
                      <span className="text-violet-700 font-medium">
                        {fmtHora(iv.inicio)} – {fmtHora(iv.fim)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-violet-400 hover:text-destructive"
                        onClick={() => onRemoverMeu?.({ inicio: iv.inicio, fim: iv.fim })}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Selected intervals list */}
      {selecoes.length > 0 && (
        <div className="rounded-lg border p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Selecionados ({selecoes.length})
          </p>
          <div className="space-y-1.5">
            {selecoes.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm"
              >
                <span className="text-emerald-700 font-medium">
                  {fmtBR(s.inicio)} → {fmtBR(s.fim)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-emerald-400 hover:text-destructive"
                  onClick={() => onRemoverSelecao?.(i)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
