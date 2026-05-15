import { useState, useEffect } from 'react';
import { Loader2, ShoppingCart, CalendarDays, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { listarIntervalos, listarRegrasSemanais } from '@/services/agendamentoService';
import { toast } from 'sonner';

const DIAS_SEMANA_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

function parseDateLocal(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fmtHora(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function isOvernightInterval(isoInicio, isoFim) {
  const ini = new Date(isoInicio);
  const fim = new Date(isoFim);
  return fim.getDate() !== ini.getDate() || fim <= ini;
}

function toLocalIso(dateStr, timeStr) {
  return `${dateStr}T${timeStr}:00`;
}

// When fim time < inicio time, fim is on the next day (pernoite).
function toFimIso(dateStr, inicioStr, fimStr) {
  if (fimStr < inicioStr) {
    const d = parseDateLocal(dateStr);
    d.setDate(d.getDate() + 1);
    return `${formatDate(d)}T${fimStr}:00`;
  }
  return `${dateStr}T${fimStr}:00`;
}

// Returns fimDate adjusted to next day when fim time < inicio time.
function ajustarFimPernoite(dateStr, inicioStr, fimStr) {
  const base = new Date(`${dateStr}T${fimStr}:00`);
  if (fimStr < inicioStr) base.setDate(base.getDate() + 1);
  return base;
}

function dayOfWeekName(date) {
  return DAY_NAMES[date.getDay()];
}

function isDiaAtivo(dayName, regras) {
  return regras.some((r) => {
    if (!r.ativa) return false;
    const startIdx = DAY_ORDER.indexOf(r.diaInicio);
    const endIdx = DAY_ORDER.indexOf(r.diaFim);
    const dayIdx = DAY_ORDER.indexOf(dayName);
    if (startIdx <= endIdx) return dayIdx >= startIdx && dayIdx <= endIdx;
    return dayIdx >= startIdx || dayIdx <= endIdx;
  });
}

function CalendarioMes({ ano, mes, diaAtivo, diaSelecionado, onSelect, minDate }) {
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const offset = primeiroDia.getDay();
  const cells = [];

  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= ultimoDia.getDate(); d++) cells.push(new Date(ano, mes, d));

  return (
    <div>
      <div className="grid grid-cols-7 text-center mb-1">
        {DIAS_SEMANA_PT.map((d) => (
          <span key={d} className="text-xs text-muted-foreground font-medium py-1">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((date, i) => {
          if (!date) return <div key={`e-${i}`} />;
          const dateStr = formatDate(date);
          const disabled = !diaAtivo(date) || date < minDate;
          const selected = dateStr === diaSelecionado;
          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(dateStr)}
              className={[
                'rounded-md p-1.5 text-sm transition-colors leading-none',
                disabled ? 'text-muted-foreground/40 cursor-not-allowed' : 'hover:bg-accent cursor-pointer',
                selected ? 'bg-primary text-primary-foreground hover:bg-primary' : '',
              ].join(' ')}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SolicitarAgendamentoModal({ open, onOpenChange, servico, onAdicionado }) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [viewAno, setViewAno] = useState(hoje.getFullYear());
  const [viewMes, setViewMes] = useState(hoje.getMonth());
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [regras, setRegras] = useState([]);
  const [intervalos, setIntervalos] = useState([]);
  const [loadingIntervalos, setLoadingIntervalos] = useState(false);
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [numeroPessoas, setNumeroPessoas] = useState(1);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open || !servico?.id) return;
    listarRegrasSemanais(servico.id)
      .then(({ data }) => setRegras(data))
      .catch(() => setRegras([]));
  }, [open, servico?.id]);

  useEffect(() => {
    if (!dataSelecionada || !servico?.id) return;
    setLoadingIntervalos(true);
    setInicio('');
    setFim('');
    listarIntervalos(servico.id, { inicio: dataSelecionada, fim: dataSelecionada })
      .then(({ data }) => setIntervalos(data.filter((i) => i.status === 'DISPONIVEL')))
      .catch(() => setIntervalos([]))
      .finally(() => setLoadingIntervalos(false));
  }, [dataSelecionada, servico?.id]);

  function diaAtivo(date) {
    if (date < hoje) return false;
    return isDiaAtivo(dayOfWeekName(date), regras);
  }

  function mesAnterior() {
    if (viewMes === 0) { setViewAno(viewAno - 1); setViewMes(11); }
    else setViewMes(viewMes - 1);
  }

  function proximoMes() {
    if (viewMes === 11) { setViewAno(viewAno + 1); setViewMes(0); }
    else setViewMes(viewMes + 1);
  }

  function selecionarIntervalo(intervalo) {
    setInicio(fmtHora(intervalo.inicio));
    setFim(fmtHora(intervalo.fim));
  }

  function validarHorario() {
    if (!inicio || !fim) return 'Selecione horário de início e fim.';
    const iniDate = new Date(`${dataSelecionada}T${inicio}:00`);
    const fimDate = ajustarFimPernoite(dataSelecionada, inicio, fim);
    if (fimDate <= iniDate) return 'O fim deve ser posterior ao início.';
    const dentroDeUmIntervalo = intervalos.some((iv) => {
      const ivIni = new Date(iv.inicio);
      const ivFim = new Date(iv.fim);
      return iniDate >= ivIni && fimDate <= ivFim;
    });
    if (!dentroDeUmIntervalo) return 'O horário deve estar dentro de uma janela disponível.';
    return null;
  }

  async function handleAdicionar() {
    const erro = validarHorario();
    if (erro) { toast.error(erro); return; }
    if (servico.tipoCobranca === 'POR_PESSOA' && (!numeroPessoas || numeroPessoas < 1)) {
      toast.error('Informe o número de pessoas.');
      return;
    }
    setSalvando(true);
    try {
      await onAdicionado({
        inicio: toLocalIso(dataSelecionada, inicio),
        fim: toFimIso(dataSelecionada, inicio, fim),
        numeroPessoas: servico.tipoCobranca === 'POR_PESSOA' ? Number(numeroPessoas) : undefined,
      });
      onOpenChange(false);
    } finally {
      setSalvando(false);
    }
  }

  const nomeMes = new Date(viewAno, viewMes, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const podeContinuar = dataSelecionada && inicio && fim;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md gap-3 p-4">
        <AlertDialogHeader className="space-y-0.5 text-left">
          <AlertDialogTitle className="text-base">Solicitar {servico?.nome}</AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            Escolha uma data e horário disponíveis.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Calendário */}
        <div className="border rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={mesAnterior} className="p-1 hover:bg-accent rounded text-sm">‹</button>
            <span className="text-sm font-medium capitalize">{nomeMes}</span>
            <button type="button" onClick={proximoMes} className="p-1 hover:bg-accent rounded text-sm">›</button>
          </div>
          <CalendarioMes
            ano={viewAno}
            mes={viewMes}
            diaAtivo={diaAtivo}
            diaSelecionado={dataSelecionada}
            onSelect={setDataSelecionada}
            minDate={hoje}
          />
        </div>

        {/* Janelas disponíveis */}
        {dataSelecionada && (
          <div>
            <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Janelas disponíveis em {parseDateLocal(dataSelecionada).toLocaleDateString('pt-BR')}
            </p>
            {loadingIntervalos ? (
              <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin" /></div>
            ) : intervalos.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">Sem horários disponíveis nesta data.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {intervalos.map((iv, i) => {
                  const overnight = isOvernightInterval(iv.inicio, iv.fim);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selecionarIntervalo(iv)}
                      className="text-xs border rounded px-2 py-1 hover:bg-accent transition-colors"
                    >
                      {fmtHora(iv.inicio)} → {fmtHora(iv.fim)}
                      {overnight && <span className="ml-1 text-muted-foreground">(+1 dia)</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Horário personalizado */}
        {dataSelecionada && intervalos.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium block mb-1">Início</label>
              <Input type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Fim</label>
              <Input type="time" value={fim} onChange={(e) => setFim(e.target.value)} className="h-8 text-sm" />
              {fim && inicio && fim < inicio && (
                <p className="text-xs text-muted-foreground mt-1">+1 dia (pernoite)</p>
              )}
            </div>
          </div>
        )}

        {/* Número de pessoas */}
        {servico?.tipoCobranca === 'POR_PESSOA' && dataSelecionada && (
          <div>
            <label className="text-xs font-medium block mb-1">Número de pessoas</label>
            <Input
              type="number"
              min={1}
              value={numeroPessoas}
              onChange={(e) => setNumeroPessoas(e.target.value)}
              className="h-8 text-sm w-28"
            />
          </div>
        )}

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="h-8 text-sm">Fechar</AlertDialogCancel>
          <Button
            onClick={handleAdicionar}
            disabled={!podeContinuar || salvando}
            className="h-8 text-sm gap-1.5"
          >
            {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
            Adicionar ao carrinho
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
