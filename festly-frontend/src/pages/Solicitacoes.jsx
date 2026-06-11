import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ClipboardList, CalendarDays, Loader2, Users,
  MapPin, Tag, MessageSquare, Mail, CheckCircle2, BadgeCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  listarAgendamentosPrestador,
  confirmarAgendamento,
  rejeitarAgendamento,
  concluirAgendamento,
} from '../services/agendamentoService';

const STATUS_LABEL = {
  PENDENTE: 'Pendente', CONFIRMADO: 'Confirmado',
  REJEITADO: 'Rejeitado', CANCELADO: 'Cancelado', CONCLUIDO: 'Concluído',
};
const STATUS_CLASS = {
  PENDENTE:   'bg-yellow-100 text-yellow-800',
  CONFIRMADO: 'bg-green-100  text-green-800',
  REJEITADO:  'bg-orange-100 text-orange-700',
  CANCELADO:  'bg-red-100    text-red-700',
  CONCLUIDO:  'bg-blue-100   text-blue-700',
};
const AVATAR_GRADIENTS = [
  ['#7c3aed', '#a78bfa'], ['#0284c7', '#38bdf8'], ['#d97706', '#fb923c'],
  ['#059669', '#34d399'], ['#e11d48', '#fb7185'], ['#4338ca', '#818cf8'],
];

function avatarGradient(nome) {
  const code = (nome?.charCodeAt(0) ?? 0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[code];
}

function fmtIntervalo(inicioISO, fimISO) {
  if (!inicioISO || !fimISO) return '';
  const ini = new Date(inicioISO);
  const fim = new Date(fimISO);
  const data = ini.toLocaleDateString('pt-BR');
  const hi = `${String(ini.getHours()).padStart(2, '0')}:${String(ini.getMinutes()).padStart(2, '0')}`;
  const hf = `${String(fim.getHours()).padStart(2, '0')}:${String(fim.getMinutes()).padStart(2, '0')}`;
  const dataFim = fim.toLocaleDateString('pt-BR');
  if (data === dataFim) return `${data} · ${hi} → ${hf}`;
  return `${data} ${hi} → ${dataFim} ${hf}`;
}

function fmtEndereco(ag) {
  const partes = [ag.rua, ag.numero, ag.bairro].filter(Boolean);
  const cidade = [ag.cidade, ag.estado].filter(Boolean).join('/');
  const cep = ag.cep ? `CEP ${ag.cep}` : '';
  const linha1 = partes.join(', ');
  const linha2 = [cidade, cep].filter(Boolean).join(' — ');
  if (!linha1 && !linha2) return null;
  return [linha1, ag.complemento, linha2].filter(Boolean).join(' · ');
}

function SolicitacaoCard({ ag, onAcao }) {
  const [from, to] = avatarGradient(ag.nomeCliente);
  const initial = ag.nomeCliente?.charAt(0).toUpperCase() ?? '?';
  const [atualizando, setAtualizando] = useState(false);
  const endereco = fmtEndereco(ag);

  async function acao(fn, label) {
    setAtualizando(true);
    try {
      await fn(ag.id);
      toast.success(`Agendamento ${label}.`);
      onAcao();
    } catch (err) {
      toast.error(err.response?.data?.erro ?? `Erro ao ${label} agendamento.`);
    } finally {
      setAtualizando(false);
    }
  }

  return (
    <div className="py-4 space-y-3">
      {/* Cabeçalho: avatar + dados do solicitante + status */}
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-white text-base font-bold select-none mt-0.5"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">{ag.nomeCliente}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Mail className="h-3 w-3 shrink-0" />
            {ag.emailCliente}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {ag.pago && (ag.status === 'PENDENTE' || ag.status === 'CONFIRMADO') && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              <BadgeCheck className="h-3 w-3" />
              Pago
            </span>
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CLASS[ag.status]}`}>
            {STATUS_LABEL[ag.status]}
          </span>
        </div>
      </div>

      {/* Detalhes da solicitação */}
      <div className="space-y-1.5 text-xs text-muted-foreground border-l-2 border-muted ml-[52px] pl-3">
        <p className="font-medium text-foreground text-sm">{ag.nomeServico}</p>

        <p className="flex items-center gap-1.5 text-emerald-600">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          {fmtIntervalo(ag.inicio, ag.fim)}
        </p>

        {ag.tipoEvento && (
          <p className="flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 shrink-0" />
            {ag.tipoEvento}
          </p>
        )}

        {ag.numeroPessoas && (
          <p className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0" />
            {ag.numeroPessoas} {ag.numeroPessoas === 1 ? 'pessoa' : 'pessoas'}
          </p>
        )}

        {endereco && (
          <p className="flex items-start gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{endereco}</span>
          </p>
        )}

        {ag.observacoes && (
          <p className="flex items-start gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span className="italic">{ag.observacoes}</span>
          </p>
        )}
      </div>

      {/* Ações para pendentes */}
      {ag.status === 'PENDENTE' && (
        <div className="flex gap-2 justify-end">
          <Button
            size="sm" variant="outline"
            className="h-7 text-xs text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            disabled={atualizando}
            onClick={() => acao(rejeitarAgendamento, 'rejeitado')}
          >
            {atualizando ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Rejeitar'}
          </Button>
          <Button
            size="sm" className="h-7 text-xs"
            disabled={atualizando}
            onClick={() => acao(confirmarAgendamento, 'confirmado')}
          >
            {atualizando ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirmar'}
          </Button>
        </div>
      )}

      {ag.status === 'CONFIRMADO' && new Date(ag.fim) < new Date() && (
        <div className="flex gap-2 justify-end">
          <Button
            size="sm" variant="outline"
            className="h-7 text-xs"
            disabled={atualizando}
            onClick={() => acao(concluirAgendamento, 'concluído')}
          >
            {atualizando
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <><CheckCircle2 className="h-3 w-3 mr-1" />Marcar concluído</>}
          </Button>
        </div>
      )}
    </div>
  );
}

// Estado de paginação por tab
const TAB_INITIAL = { list: [], page: -1, hasMore: true };

export default function Solicitacoes() {
  const [activeTab, setActiveTab] = useState('pendentes');
  const [tabState, setTabState] = useState({
    pendentes: { ...TAB_INITIAL },
    historico: { ...TAB_INITIAL },
  });
  const [loading, setLoading]       = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelaRef = useRef(null);

  const isPendente = activeTab === 'pendentes';
  const current = tabState[activeTab];

  const carregarPagina = useCallback(async (tab, pagina) => {
    if (pagina === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const { data } = await listarAgendamentosPrestador({
        pendente: tab === 'pendentes',
        page: pagina,
        size: 10,
      });
      setTabState((prev) => ({
        ...prev,
        [tab]: {
          list: pagina === 0 ? data.content : [...prev[tab].list, ...data.content],
          page: pagina,
          hasMore: !data.last,
        },
      }));
    } catch {
      toast.error('Erro ao carregar solicitações.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Carrega a tab ativa quando ainda não foi carregada (page === -1)
  const currentPage = current.page;
  useEffect(() => {
    if (currentPage === -1) carregarPagina(activeTab, 0);
  }, [activeTab, currentPage, carregarPagina]);

  // Scroll infinito
  useEffect(() => {
    if (!current.hasMore || loading || loadingMore || currentPage === -1) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && current.hasMore && !loadingMore) {
          carregarPagina(activeTab, currentPage + 1);
        }
      },
      { rootMargin: '200px' }
    );

    const el = sentinelaRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [activeTab, current.hasMore, currentPage, loading, loadingMore, carregarPagina]);

  // Ao confirmar/rejeitar: reseta ambas as tabs para recarregar do zero
  function recarregarTudo() {
    setTabState({ pendentes: { ...TAB_INITIAL }, historico: { ...TAB_INITIAL } });
  }

  const pendentesCount = tabState.pendentes.list.length;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <h1 className="text-xl font-bold flex items-center gap-2 mb-6">
        <ClipboardList className="h-5 w-5" />
        Solicitações
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {[
          { key: 'pendentes', label: 'Pendentes' },
          { key: 'historico', label: 'Histórico' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {label}
            {key === 'pendentes' && pendentesCount > 0 && (
              <span className="ml-1.5 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                {pendentesCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Skeletons de carregamento inicial */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {!loading && current.list.length === 0 && current.page >= 0 && (
        <div className="text-center py-10 sm:py-20 text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">
            {isPendente ? 'Nenhuma solicitação pendente.' : 'Nenhum histórico ainda.'}
          </p>
        </div>
      )}

      {/* Lista */}
      {!loading && current.list.length > 0 && (
        <Card>
          <CardContent className="p-4 divide-y divide-border">
            {current.list.map((ag) => (
              <SolicitacaoCard key={ag.id} ag={ag} onAcao={recarregarTudo} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sentinela de scroll infinito */}
      {!loading && current.hasMore && (
        <div ref={sentinelaRef} className="py-4 flex justify-center">
          {loadingMore && (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>
      )}

      {!loading && !current.hasMore && current.list.length > 0 && (
        <p className="text-center text-xs text-muted-foreground pt-6">
          Todas as solicitações foram carregadas.
        </p>
      )}
    </div>
  );
}
