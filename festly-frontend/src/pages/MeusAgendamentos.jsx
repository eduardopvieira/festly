import { useState, useEffect, useRef, useCallback } from 'react';
import { CalendarDays, Search, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '../contexts/AuthContext';
import { listarAgendamentosCliente, cancelarAgendamento } from '../services/agendamentoService';

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
  const dataFim = fim.toLocaleDateString('pt-BR');
  const hi = `${String(ini.getHours()).padStart(2, '0')}:${String(ini.getMinutes()).padStart(2, '0')}`;
  const hf = `${String(fim.getHours()).padStart(2, '0')}:${String(fim.getMinutes()).padStart(2, '0')}`;
  if (data === dataFim) return `${data} · ${hi} → ${hf}`;
  return `${data} ${hi} → ${dataFim} ${hf}`;
}

function AgendamentoCard({ agendamento, onCancelClick, isCanceling }) {
  const [from, to] = avatarGradient(agendamento.nomeServico);
  const initial = agendamento.nomeServico?.charAt(0).toUpperCase() ?? '?';
  const canCancel = agendamento.status === 'PENDENTE';

  return (
    <div className="flex items-center gap-4 py-4">
      <div
        className="h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white text-xl font-bold select-none"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        {initial}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-tight">{agendamento.nomeServico}</p>
        <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
          <CalendarDays className="h-3 w-3" />
          {fmtIntervalo(agendamento.inicio, agendamento.fim)}
        </p>
        {agendamento.nomePrestador && (
          <p className="text-xs text-muted-foreground mt-0.5">{agendamento.nomePrestador}</p>
        )}
      </div>

      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_CLASS[agendamento.status]}`}>
        {STATUS_LABEL[agendamento.status]}
      </span>

      {canCancel && (
        <Button
          variant="ghost" size="sm"
          onClick={() => onCancelClick(agendamento)}
          disabled={isCanceling}
          className="text-muted-foreground hover:text-destructive shrink-0 text-xs"
        >
          {isCanceling ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Cancelar'}
        </Button>
      )}
    </div>
  );
}

const TAB_INITIAL = { list: [], page: -1, hasMore: true };

export default function MeusAgendamentos() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('ativos');
  const [tabState, setTabState] = useState({
    ativos:   { ...TAB_INITIAL },
    historico: { ...TAB_INITIAL },
  });
  const [loading, setLoading]         = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cancelTarget, setCancelTarget]   = useState(null);
  const [cancelingId, setCancelingId]     = useState(null);
  const sentinelaRef = useRef(null);

  const current = tabState[activeTab];
  const currentPage = current.page;

  const carregarPagina = useCallback(async (tab, pagina) => {
    if (pagina === 0) setLoading(true);
    else setLoadingMore(true);
    try {
      const { data } = await listarAgendamentosCliente(user.id, {
        ativo: tab === 'ativos',
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
      toast.error('Erro ao carregar agendamentos.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user.id]);

  // Carrega a tab quando não foi carregada ainda
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

  function recarregarTudo() {
    setTabState({ ativos: { ...TAB_INITIAL }, historico: { ...TAB_INITIAL } });
  }

  async function handleConfirmCancel() {
    if (!cancelTarget) return;
    const target = cancelTarget;
    setCancelTarget(null);
    setCancelingId(target.id);
    try {
      await cancelarAgendamento(target.id, user.id);
      toast.success('Agendamento cancelado.');
      recarregarTudo();
    } catch (err) {
      toast.error(err.response?.data?.erro || 'Erro ao cancelar agendamento.');
    } finally {
      setCancelingId(null);
    }
  }

  const ativosCount = tabState.ativos.list.length;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <h1 className="text-xl font-bold flex items-center gap-2 mb-6">
        <CalendarDays className="h-5 w-5" />
        Meus Agendamentos
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {[
          { key: 'ativos', label: 'Ativos' },
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
            {key === 'ativos' && ativosCount > 0 && (
              <span className="ml-1.5 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                {ativosCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Skeletons */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {!loading && current.list.length === 0 && currentPage >= 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-20" />
          {activeTab === 'ativos' ? (
            <>
              <p className="font-medium">Você não tem agendamentos ativos.</p>
              <p className="text-sm mt-1 mb-6">Explore o catálogo para agendar serviços.</p>
              <Link to="/dashboard/servicos">
                <Button size="sm" className="gap-2">
                  <Search className="h-4 w-4" />
                  Explorar serviços
                </Button>
              </Link>
            </>
          ) : (
            <p className="font-medium">Nenhum agendamento anterior.</p>
          )}
        </div>
      )}

      {/* Lista */}
      {!loading && current.list.length > 0 && (
        <Card>
          <CardContent className="p-4 divide-y divide-border">
            {current.list.map((ag) => (
              <AgendamentoCard
                key={ag.id}
                agendamento={ag}
                onCancelClick={setCancelTarget}
                isCanceling={cancelingId === ag.id}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sentinela */}
      {!loading && current.hasMore && (
        <div ref={sentinelaRef} className="py-4 flex justify-center">
          {loadingMore && (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>
      )}

      {!loading && !current.hasMore && current.list.length > 0 && (
        <p className="text-center text-xs text-muted-foreground pt-6">
          Todos os agendamentos foram carregados.
        </p>
      )}

      {/* Dialog de cancelamento */}
      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => { if (!open) setCancelTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar o agendamento de{' '}
              <strong>{cancelTarget?.nomeServico}</strong>
              {cancelTarget && <> em {fmtIntervalo(cancelTarget.inicio, cancelTarget.fim)}</>}?
              {' '}Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter agendamento</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
