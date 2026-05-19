import { useState, useEffect } from 'react';
import { Loader2, ShoppingCart, Clock, MapPin, ChevronLeft, Plus, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
} from '@/components/ui/alert-dialog';
import { listarIntervalos, listarRegrasSemanais } from '@/services/agendamentoService';
import { listarEnderecos, salvarEndereco } from '@/services/enderecoService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const DIAS_SEMANA_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

function parseDateLocal(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
function toLocalIso(dateStr, timeStr) { return `${dateStr}T${timeStr}:00`; }
function toFimIso(dateStr, inicioStr, fimStr) {
  if (fimStr < inicioStr) {
    const d = parseDateLocal(dateStr);
    d.setDate(d.getDate() + 1);
    return `${formatDate(d)}T${fimStr}:00`;
  }
  return `${dateStr}T${fimStr}:00`;
}
function ajustarFimPernoite(dateStr, inicioStr, fimStr) {
  const base = new Date(`${dateStr}T${fimStr}:00`);
  if (fimStr < inicioStr) base.setDate(base.getDate() + 1);
  return base;
}
function dayOfWeekName(date) { return DAY_NAMES[date.getDay()]; }
function isDiaAtivo(dayName, regras) {
  return regras.some((r) => {
    if (!r.ativa) return false;
    const si = DAY_ORDER.indexOf(r.diaInicio);
    const ei = DAY_ORDER.indexOf(r.diaFim);
    const di = DAY_ORDER.indexOf(dayName);
    return si <= ei ? di >= si && di <= ei : di >= si || di <= ei;
  });
}

function CalendarioMes({ ano, mes, diaAtivo, diaSelecionado, onSelect, minDate }) {
  const offset = new Date(ano, mes, 1).getDay();
  const total = new Date(ano, mes + 1, 0).getDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: total }, (_, i) => new Date(ano, mes, i + 1))];
  return (
    <div>
      <div className="grid grid-cols-7 text-center mb-0.5">
        {DIAS_SEMANA_PT.map((d) => (
          <span key={d} className="text-[10px] text-muted-foreground font-medium py-0.5">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map((date, i) => {
          if (!date) return <div key={`e-${i}`} />;
          const ds = formatDate(date);
          const disabled = !diaAtivo(date) || date < minDate;
          const selected = ds === diaSelecionado;
          return (
            <button
              key={ds}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(ds)}
              className={[
                'rounded-md py-1.5 text-xs leading-none transition-colors',
                disabled ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-accent cursor-pointer',
                selected ? 'bg-primary text-primary-foreground hover:bg-primary font-semibold' : '',
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

function enderecoLabel(e) {
  return e.apelido
    ? `${e.apelido} — ${e.rua}, ${e.numero}`
    : `${e.rua}, ${e.numero}, ${e.bairro}`;
}

export default function SolicitarAgendamentoModal({ open, onOpenChange, servico, onAdicionado }) {
  const { user } = useAuth();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [step, setStep] = useState(1);
  const [viewAno, setViewAno] = useState(hoje.getFullYear());
  const [viewMes, setViewMes] = useState(hoje.getMonth());
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [regras, setRegras] = useState([]);
  const [intervalos, setIntervalos] = useState([]);
  const [loadingIntervalos, setLoadingIntervalos] = useState(false);
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [numeroPessoas, setNumeroPessoas] = useState(1);

  const [enderecosSalvos, setEnderecosSalvos] = useState([]);
  const [loadingEnderecos, setLoadingEnderecos] = useState(false);
  const [enderecoSelecionadoId, setEnderecoSelecionadoId] = useState(null);
  const [mostrarFormEndereco, setMostrarFormEndereco] = useState(false);
  const [salvarEsteEndereco, setSalvarEsteEndereco] = useState(false);
  const [apelidoNovo, setApelidoNovo] = useState('');
  const [rua, setRua] = useState('');
  const [numeroEnd, setNumeroEnd] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');
  const [tipoEvento, setTipoEvento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [numConvidados, setNumConvidados] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep(1); setDataSelecionada(''); setInicio(''); setFim(''); setNumeroPessoas(1);
      setEnderecoSelecionadoId(null); setMostrarFormEndereco(false); setSalvarEsteEndereco(false);
      setApelidoNovo(''); setRua(''); setNumeroEnd(''); setComplemento('');
      setBairro(''); setCidade(''); setEstado(''); setCep('');
      setTipoEvento(''); setObservacoes(''); setNumConvidados('');
    }
  }, [open]);

  useEffect(() => {
    if (!open || !servico?.id) return;
    listarRegrasSemanais(servico.id).then(({ data }) => setRegras(data)).catch(() => setRegras([]));
  }, [open, servico?.id]);

  useEffect(() => {
    if (!dataSelecionada || !servico?.id) return;
    setLoadingIntervalos(true); setInicio(''); setFim('');
    listarIntervalos(servico.id, { inicio: dataSelecionada, fim: dataSelecionada })
      .then(({ data }) => setIntervalos(data.filter((i) => i.status === 'DISPONIVEL')))
      .catch(() => setIntervalos([]))
      .finally(() => setLoadingIntervalos(false));
  }, [dataSelecionada, servico?.id]);

  useEffect(() => {
    if (step !== 2 || !user?.id) return;
    setLoadingEnderecos(true);
    listarEnderecos(user.id)
      .then(({ data }) => {
        setEnderecosSalvos(data);
        if (data.length === 0) { setMostrarFormEndereco(true); setEnderecoSelecionadoId(null); }
        else if (enderecoSelecionadoId === null && !mostrarFormEndereco) setEnderecoSelecionadoId(data[0].id);
      })
      .catch(() => setEnderecosSalvos([]))
      .finally(() => setLoadingEnderecos(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, user?.id]);

  function diaAtivo(date) { return date >= hoje && isDiaAtivo(dayOfWeekName(date), regras); }
  function mesAnterior() { viewMes === 0 ? (setViewAno(viewAno - 1), setViewMes(11)) : setViewMes(viewMes - 1); }
  function proximoMes()  { viewMes === 11 ? (setViewAno(viewAno + 1), setViewMes(0)) : setViewMes(viewMes + 1); }

  function selecionarIntervalo(iv) { setInicio(fmtHora(iv.inicio)); setFim(fmtHora(iv.fim)); }

  function validarHorario() {
    if (!inicio || !fim) return 'Selecione horário de início e fim.';
    const iniDate = new Date(`${dataSelecionada}T${inicio}:00`);
    const fimDate = ajustarFimPernoite(dataSelecionada, inicio, fim);
    if (fimDate <= iniDate) return 'O fim deve ser posterior ao início.';
    if (!intervalos.some((iv) => iniDate >= new Date(iv.inicio) && fimDate <= new Date(iv.fim)))
      return 'O horário deve estar dentro de uma janela disponível.';
    return null;
  }

  function resolverEndereco() {
    if (!mostrarFormEndereco && enderecoSelecionadoId !== null) {
      const s = enderecosSalvos.find((e) => e.id === enderecoSelecionadoId);
      if (!s) return null;
      return { rua: s.rua, numero: s.numero, bairro: s.bairro, cidade: s.cidade, estado: s.estado, cep: s.cep, complemento: s.complemento ?? '' };
    }
    if (!rua || !numeroEnd || !bairro || !cidade || !estado || !cep) return null;
    return { rua, numero: numeroEnd, bairro, cidade, estado, cep, complemento };
  }

  async function handleAdicionar() {
    const end = resolverEndereco();
    if (!end) { toast.error('Preencha todos os campos obrigatórios do endereço.'); return; }
    if (servico.tipoCobranca === 'POR_PESSOA' && (!numeroPessoas || numeroPessoas < 1)) {
      toast.error('Informe o número de pessoas.'); return;
    }
    setSalvando(true);
    try {
      if (salvarEsteEndereco && mostrarFormEndereco && user?.id) {
        try {
          const r = await salvarEndereco(user.id, { ...end, apelido: apelidoNovo || undefined });
          setEnderecosSalvos((p) => [...p, r.data]);
        } catch { /* melhor esforço */ }
      }
      const pessoas = servico.tipoCobranca === 'POR_PESSOA'
        ? Number(numeroPessoas)
        : (numConvidados ? Number(numConvidados) : undefined);
      await onAdicionado({
        inicio: toLocalIso(dataSelecionada, inicio),
        fim: toFimIso(dataSelecionada, inicio, fim),
        numeroPessoas: pessoas,
        ...end,
        tipoEvento: tipoEvento || undefined,
        observacoes: observacoes || undefined,
      });
      onOpenChange(false);
    } finally { setSalvando(false); }
  }

  const nomeMes = new Date(viewAno, viewMes, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const podeContinuar = dataSelecionada && inicio && fim;
  const slotSelecionado = (iv) => fmtHora(iv.inicio) === inicio && fmtHora(iv.fim) === fim;

  // ─── Passo 1 ─────────────────────────────────────────────────────────────

  const passo1 = (
    <div className="grid grid-cols-[1fr,1fr] gap-5 min-h-0">
      {/* Coluna esquerda — Calendário */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <button type="button" onClick={mesAnterior} className="h-6 w-6 rounded hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground">‹</button>
          <span className="text-xs font-semibold capitalize">{nomeMes}</span>
          <button type="button" onClick={proximoMes} className="h-6 w-6 rounded hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground">›</button>
        </div>
        <CalendarioMes
          ano={viewAno} mes={viewMes}
          diaAtivo={diaAtivo} diaSelecionado={dataSelecionada}
          onSelect={setDataSelecionada} minDate={hoje}
        />
      </div>

      {/* Coluna direita — Horários */}
      <div className="flex flex-col gap-3 min-h-0">
        {!dataSelecionada ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 text-muted-foreground/60 border-2 border-dashed rounded-xl p-4">
            <Clock className="h-7 w-7" />
            <p className="text-xs leading-tight">Selecione uma data<br />para ver os horários</p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-xs font-semibold mb-2 text-foreground">
                {parseDateLocal(dataSelecionada).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
              {loadingIntervalos ? (
                <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
              ) : intervalos.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 border rounded-lg">Sem horários disponíveis.</p>
              ) : (
                <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-0.5">
                  {intervalos.map((iv, i) => {
                    const overnight = isOvernightInterval(iv.inicio, iv.fim);
                    const selected = slotSelecionado(iv);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selecionarIntervalo(iv)}
                        className={[
                          'w-full text-left px-3 py-2 rounded-lg border text-xs transition-all',
                          selected
                            ? 'border-primary bg-primary/5 text-primary font-medium'
                            : 'hover:border-primary/50 hover:bg-accent',
                        ].join(' ')}
                      >
                        <span className="font-medium">{fmtHora(iv.inicio)}</span>
                        <span className="text-muted-foreground mx-1">→</span>
                        <span className="font-medium">{fmtHora(iv.fim)}</span>
                        {overnight && <span className="ml-1 text-[10px] text-muted-foreground">+1 dia</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {intervalos.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Ou defina o horário:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">Início</label>
                    <Input type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">Fim</label>
                    <Input type="time" value={fim} onChange={(e) => setFim(e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
                {fim && inicio && fim < inicio && (
                  <p className="text-[10px] text-amber-500 mt-1">Vai até o dia seguinte (+1 dia)</p>
                )}
              </div>
            )}

            {servico?.tipoCobranca === 'POR_PESSOA' && (
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">
                  <Users className="h-3 w-3 inline mr-1" />Pessoas
                </label>
                <Input
                  type="number" min={1} value={numeroPessoas}
                  onChange={(e) => setNumeroPessoas(e.target.value)}
                  className="h-8 text-xs w-24"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  // ─── Passo 2 ─────────────────────────────────────────────────────────────

  const passo2 = (
    <div className="flex flex-col gap-4">
      {/* Endereço */}
      <div>
        <p className="text-xs font-semibold flex items-center gap-1.5 mb-2">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          Local do evento <span className="text-destructive font-normal">*</span>
        </p>

        {loadingEnderecos ? (
          <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
        ) : (
          <>
            {enderecosSalvos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 mb-3 scrollbar-none">
                {enderecosSalvos.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => { setEnderecoSelecionadoId(e.id); setMostrarFormEndereco(false); }}
                    className={[
                      'flex-none text-xs border rounded-lg px-3 py-2 text-left whitespace-nowrap transition-all',
                      enderecoSelecionadoId === e.id && !mostrarFormEndereco
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'hover:border-primary/40 hover:bg-accent/50',
                    ].join(' ')}
                  >
                    <p className="font-medium">{e.apelido || 'Endereço'}</p>
                    <p className="text-muted-foreground text-[10px] mt-0.5">{e.rua}, {e.numero} — {e.cidade}/{e.estado}</p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setEnderecoSelecionadoId(null); setMostrarFormEndereco(true); setRua(''); setNumeroEnd(''); setComplemento(''); setBairro(''); setCidade(''); setEstado(''); setCep(''); setSalvarEsteEndereco(false); setApelidoNovo(''); }}
                  className={[
                    'flex-none text-xs border rounded-lg px-3 py-2 flex flex-col items-center justify-center gap-1 min-w-[72px] transition-all',
                    mostrarFormEndereco ? 'border-primary bg-primary/5 text-primary' : 'hover:border-primary/40 hover:bg-accent/50 text-muted-foreground',
                  ].join(' ')}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Novo</span>
                </button>
              </div>
            )}

            {mostrarFormEndereco && (
              <div className="border rounded-xl p-3 space-y-2 bg-muted/20">
                <div className="grid grid-cols-[1fr,auto] gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">Rua / Avenida *</label>
                    <Input value={rua} onChange={(e) => setRua(e.target.value)} className="h-8 text-xs" placeholder="Ex: Av. Paulista" />
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">Número *</label>
                    <Input value={numeroEnd} onChange={(e) => setNumeroEnd(e.target.value)} className="h-8 text-xs" placeholder="123" />
                  </div>
                </div>
                <Input value={complemento} onChange={(e) => setComplemento(e.target.value)} className="h-8 text-xs" placeholder="Complemento (Apto, Bloco…)" />
                <div className="grid grid-cols-[1fr,1fr,80px] gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">Bairro *</label>
                    <Input value={bairro} onChange={(e) => setBairro(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">Cidade *</label>
                    <Input value={cidade} onChange={(e) => setCidade(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">UF *</label>
                    <select value={estado} onChange={(e) => setEstado(e.target.value)} className="h-8 text-xs w-full border rounded-md px-2 bg-background">
                      <option value="">—</option>
                      {ESTADOS_BR.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                </div>
                <div className="w-32">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">CEP *</label>
                  <Input value={cep} onChange={(e) => setCep(e.target.value)} className="h-8 text-xs" placeholder="00000-000" maxLength={9} />
                </div>

                <div className="flex items-center gap-2 pt-0.5 border-t">
                  <input id="salvarEnd" type="checkbox" checked={salvarEsteEndereco}
                    onChange={(e) => setSalvarEsteEndereco(e.target.checked)} className="h-3.5 w-3.5 mt-2 flex-none" />
                  <label htmlFor="salvarEnd" className="text-xs cursor-pointer text-muted-foreground mt-2">Salvar endereço na conta</label>
                </div>
                {salvarEsteEndereco && (
                  <Input value={apelidoNovo} onChange={(e) => setApelidoNovo(e.target.value)} className="h-8 text-xs"
                    placeholder="Apelido (ex: Casa, Clube, Salão)" maxLength={50} />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Tipo do evento + Convidados na mesma linha */}
      <div className="grid grid-cols-[1fr,auto] gap-3">
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">Tipo do evento</label>
          <Input value={tipoEvento} onChange={(e) => setTipoEvento(e.target.value)} className="h-8 text-xs"
            placeholder="Ex: Casamento, Aniversário 15 anos…" maxLength={100} />
        </div>
        {servico?.tipoCobranca !== 'POR_PESSOA' && (
          <div className="w-28">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">
              <Users className="h-3 w-3 inline mr-1" />Convidados
            </label>
            <Input type="number" min={1} value={numConvidados} onChange={(e) => setNumConvidados(e.target.value)}
              className="h-8 text-xs" placeholder="—" />
          </div>
        )}
      </div>

      {/* Observações */}
      <div>
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">Observações ao prestador</label>
        <textarea
          value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-xs bg-background resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          rows={2} maxLength={2000} placeholder="Instruções especiais, restrições, dúvidas…"
        />
      </div>
    </div>
  );

  // ─── Modal ───────────────────────────────────────────────────────────────

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="p-0 gap-0 overflow-hidden flex flex-col sm:max-w-3xl max-h-[92vh]">

        {/* Header fixo */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b flex-none">
          <div className="flex items-center gap-2 min-w-0">
            {step === 2 && (
              <button type="button" onClick={() => setStep(1)}
                className="h-7 w-7 rounded-full hover:bg-accent flex items-center justify-center flex-none text-muted-foreground">
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="font-semibold text-sm truncate">{servico?.nome}</h2>
              <p className="text-xs text-muted-foreground">
                {step === 1 ? 'Data e horário' : 'Local e detalhes'}
              </p>
            </div>
          </div>
          <button type="button" onClick={() => onOpenChange(false)}
            className="h-7 w-7 rounded-full hover:bg-accent flex items-center justify-center flex-none text-muted-foreground ml-2">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Indicador de passos */}
        <div className="flex gap-1 px-5 py-2 border-b flex-none">
          {[1, 2].map((s) => (
            <div key={s} className={`h-0.5 rounded-full flex-1 transition-all ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {/* Conteúdo rolável */}
        <div className="overflow-y-auto flex-1 px-5 py-4 min-h-0">
          {step === 1 ? passo1 : passo2}
        </div>

        {/* Footer fixo */}
        <div className="px-5 py-3 border-t flex-none flex items-center justify-between gap-2">
          <AlertDialogCancel className="h-9 px-4 text-sm rounded-full">Cancelar</AlertDialogCancel>
          {step === 1 ? (
            <Button
              onClick={() => { const e = validarHorario(); if (e) { toast.error(e); return; } setStep(2); }}
              disabled={!podeContinuar}
              className="h-9 px-6 text-sm rounded-full"
            >
              Próximo →
            </Button>
          ) : (
            <Button onClick={handleAdicionar} disabled={salvando} className="h-9 px-5 text-sm rounded-full gap-1.5">
              {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
              Adicionar ao carrinho
            </Button>
          )}
        </div>

      </AlertDialogContent>
    </AlertDialog>
  );
}
