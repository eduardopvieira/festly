import { useState, useEffect } from 'react';
import { Loader2, ShoppingCart, Clock, MapPin, ChevronLeft, Plus } from 'lucide-react';
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
import { listarEnderecos, salvarEndereco } from '@/services/enderecoService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const DIAS_SEMANA_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

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

function enderecoLabel(e) {
  const apelido = e.apelido ? `${e.apelido} — ` : '';
  return `${apelido}${e.rua}, ${e.numero}, ${e.bairro}, ${e.cidade}/${e.estado}`;
}

export default function SolicitarAgendamentoModal({ open, onOpenChange, servico, onAdicionado }) {
  const { user } = useAuth();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Passo 1 — data e horário
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

  // Passo 2 — endereço e evento
  const [enderecosSalvos, setEnderecosSalvos] = useState([]);
  const [loadingEnderecos, setLoadingEnderecos] = useState(false);
  const [enderecoSelecionadoId, setEnderecoSelecionadoId] = useState(null); // null = novo
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

  // Reset ao abrir/fechar
  useEffect(() => {
    if (!open) {
      setStep(1);
      setDataSelecionada('');
      setInicio('');
      setFim('');
      setNumeroPessoas(1);
      setEnderecoSelecionadoId(null);
      setMostrarFormEndereco(false);
      setSalvarEsteEndereco(false);
      setApelidoNovo('');
      setRua(''); setNumeroEnd(''); setComplemento('');
      setBairro(''); setCidade(''); setEstado(''); setCep('');
      setTipoEvento(''); setObservacoes(''); setNumConvidados('');
    }
  }, [open]);

  // Regras semanais
  useEffect(() => {
    if (!open || !servico?.id) return;
    listarRegrasSemanais(servico.id)
      .then(({ data }) => setRegras(data))
      .catch(() => setRegras([]));
  }, [open, servico?.id]);

  // Intervalos ao selecionar data
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

  // Endereços salvos ao entrar no passo 2
  useEffect(() => {
    if (step !== 2 || !user?.id) return;
    setLoadingEnderecos(true);
    listarEnderecos(user.id)
      .then(({ data }) => {
        setEnderecosSalvos(data);
        if (data.length === 0) {
          setMostrarFormEndereco(true);
          setEnderecoSelecionadoId(null);
        } else if (enderecoSelecionadoId === null && !mostrarFormEndereco) {
          setEnderecoSelecionadoId(data[0].id);
        }
      })
      .catch(() => setEnderecosSalvos([]))
      .finally(() => setLoadingEnderecos(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, user?.id]);

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

  function resolverEndereco() {
    if (!mostrarFormEndereco && enderecoSelecionadoId !== null) {
      const salvo = enderecosSalvos.find((e) => e.id === enderecoSelecionadoId);
      if (!salvo) return null;
      return {
        rua: salvo.rua, numero: salvo.numero, bairro: salvo.bairro,
        cidade: salvo.cidade, estado: salvo.estado, cep: salvo.cep,
        complemento: salvo.complemento ?? '',
      };
    }
    if (!rua || !numeroEnd || !bairro || !cidade || !estado || !cep) return null;
    return { rua, numero: numeroEnd, bairro, cidade, estado, cep, complemento };
  }

  function validarPasso2() {
    const end = resolverEndereco();
    if (!end) return 'Preencha todos os campos obrigatórios do endereço.';
    return null;
  }

  async function handleAdicionar() {
    const erroEnd = validarPasso2();
    if (erroEnd) { toast.error(erroEnd); return; }

    if (servico.tipoCobranca === 'POR_PESSOA' && (!numeroPessoas || numeroPessoas < 1)) {
      toast.error('Informe o número de pessoas.');
      return;
    }

    const enderecoResolv = resolverEndereco();
    setSalvando(true);

    try {
      if (salvarEsteEndereco && mostrarFormEndereco && user?.id) {
        try {
          const novoSalvo = await salvarEndereco(user.id, {
            ...enderecoResolv,
            apelido: apelidoNovo || undefined,
          });
          setEnderecosSalvos((prev) => [...prev, novoSalvo.data]);
        } catch {
          // salvar endereço é melhor esforço, não bloqueia o fluxo
        }
      }

      const pessoasParaEnviar = servico.tipoCobranca === 'POR_PESSOA'
        ? Number(numeroPessoas)
        : (numConvidados ? Number(numConvidados) : undefined);

      await onAdicionado({
        inicio: toLocalIso(dataSelecionada, inicio),
        fim: toFimIso(dataSelecionada, inicio, fim),
        numeroPessoas: pessoasParaEnviar,
        ...enderecoResolv,
        tipoEvento: tipoEvento || undefined,
        observacoes: observacoes || undefined,
      });
      onOpenChange(false);
    } finally {
      setSalvando(false);
    }
  }

  function selecionarEnderecoSalvo(id) {
    setEnderecoSelecionadoId(id);
    setMostrarFormEndereco(false);
  }

  function ativarNovoEndereco() {
    setEnderecoSelecionadoId(null);
    setMostrarFormEndereco(true);
    setRua(''); setNumeroEnd(''); setComplemento('');
    setBairro(''); setCidade(''); setEstado(''); setCep('');
    setSalvarEsteEndereco(false);
    setApelidoNovo('');
  }

  const nomeMes = new Date(viewAno, viewMes, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const podeContinuar = dataSelecionada && inicio && fim;

  // ─── Renderização por passo ───────────────────────────────────────────────

  const passo1 = (
    <>
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

      {/* Número de pessoas — apenas POR_PESSOA */}
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
    </>
  );

  const passo2 = (
    <>
      {/* Endereço do evento */}
      <div>
        <p className="text-xs font-medium mb-2 flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          Endereço do evento <span className="text-destructive">*</span>
        </p>

        {loadingEnderecos ? (
          <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin" /></div>
        ) : (
          <>
            {/* Chips de endereços salvos */}
            {enderecosSalvos.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {enderecosSalvos.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => selecionarEnderecoSalvo(e.id)}
                    className={[
                      'text-xs border rounded-full px-3 py-1 transition-colors text-left max-w-full',
                      enderecoSelecionadoId === e.id && !mostrarFormEndereco
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-accent',
                    ].join(' ')}
                  >
                    {enderecoLabel(e)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={ativarNovoEndereco}
                  className={[
                    'text-xs border rounded-full px-3 py-1 transition-colors flex items-center gap-1',
                    mostrarFormEndereco
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-accent',
                  ].join(' ')}
                >
                  <Plus className="h-3 w-3" /> Novo endereço
                </button>
              </div>
            )}

            {/* Formulário de novo endereço */}
            {mostrarFormEndereco && (
              <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-xs font-medium block mb-1">Rua / Avenida <span className="text-destructive">*</span></label>
                    <Input value={rua} onChange={(e) => setRua(e.target.value)} className="h-8 text-sm" placeholder="Ex: Av. Paulista" />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Número <span className="text-destructive">*</span></label>
                    <Input value={numeroEnd} onChange={(e) => setNumeroEnd(e.target.value)} className="h-8 text-sm" placeholder="1234" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Complemento</label>
                  <Input value={complemento} onChange={(e) => setComplemento(e.target.value)} className="h-8 text-sm" placeholder="Apto, Bloco, etc." />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium block mb-1">Bairro <span className="text-destructive">*</span></label>
                    <Input value={bairro} onChange={(e) => setBairro(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">CEP <span className="text-destructive">*</span></label>
                    <Input
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      className="h-8 text-sm"
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-xs font-medium block mb-1">Cidade <span className="text-destructive">*</span></label>
                    <Input value={cidade} onChange={(e) => setCidade(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">UF <span className="text-destructive">*</span></label>
                    <select
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      className="h-8 text-sm w-full border rounded-md px-2 bg-background"
                    >
                      <option value="">—</option>
                      {ESTADOS_BR.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                </div>

                {/* Salvar endereço */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="salvarEnd"
                    type="checkbox"
                    checked={salvarEsteEndereco}
                    onChange={(e) => setSalvarEsteEndereco(e.target.checked)}
                    className="h-3.5 w-3.5"
                  />
                  <label htmlFor="salvarEnd" className="text-xs cursor-pointer">Salvar este endereço na minha conta</label>
                </div>
                {salvarEsteEndereco && (
                  <Input
                    value={apelidoNovo}
                    onChange={(e) => setApelidoNovo(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="Apelido (ex: Casa, Clube, Salão)"
                    maxLength={50}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Tipo do evento */}
      <div>
        <label className="text-xs font-medium block mb-1">Tipo do evento</label>
        <Input
          value={tipoEvento}
          onChange={(e) => setTipoEvento(e.target.value)}
          className="h-8 text-sm"
          placeholder="Ex: Casamento, Aniversário 15 anos, Formatura…"
          maxLength={100}
        />
      </div>

      {/* Número de convidados — apenas para não-POR_PESSOA */}
      {servico?.tipoCobranca !== 'POR_PESSOA' && (
        <div>
          <label className="text-xs font-medium block mb-1">Número de convidados esperado</label>
          <Input
            type="number"
            min={1}
            value={numConvidados}
            onChange={(e) => setNumConvidados(e.target.value)}
            className="h-8 text-sm w-28"
            placeholder="—"
          />
        </div>
      )}

      {/* Observações */}
      <div>
        <label className="text-xs font-medium block mb-1">Observações ao prestador</label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          rows={3}
          maxLength={2000}
          placeholder="Instruções especiais, restrições, dúvidas…"
        />
      </div>
    </>
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md gap-3 p-4">
        <AlertDialogHeader className="space-y-0.5 text-left">
          <AlertDialogTitle className="text-base flex items-center gap-2">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="p-0.5 hover:bg-accent rounded"
                aria-label="Voltar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            Solicitar {servico?.nome}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            {step === 1 ? 'Escolha uma data e horário disponíveis.' : 'Informe o local e detalhes do evento.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Indicador de passos */}
        <div className="flex gap-1.5 items-center">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={[
                'h-1 rounded-full flex-1 transition-colors',
                s <= step ? 'bg-primary' : 'bg-muted',
              ].join(' ')}
            />
          ))}
        </div>

        {step === 1 ? passo1 : passo2}

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="h-8 text-sm">Fechar</AlertDialogCancel>
          {step === 1 ? (
            <Button
              onClick={() => {
                const erro = validarHorario();
                if (erro) { toast.error(erro); return; }
                setStep(2);
              }}
              disabled={!podeContinuar}
              className="h-8 text-sm"
            >
              Próximo
            </Button>
          ) : (
            <Button
              onClick={handleAdicionar}
              disabled={salvando}
              className="h-8 text-sm gap-1.5"
            >
              {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
              Adicionar ao carrinho
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
