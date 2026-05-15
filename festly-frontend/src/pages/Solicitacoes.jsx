import { useState, useEffect } from 'react';
import { ClipboardList, CalendarDays, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  listarAgendamentosPrestador,
  confirmarAgendamento,
  rejeitarAgendamento,
} from '../services/agendamentoService';

const STATUS_LABEL = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  REJEITADO: 'Rejeitado',
  CANCELADO: 'Cancelado',
  CONCLUIDO: 'Concluído',
};

const STATUS_CLASS = {
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  CONFIRMADO: 'bg-green-100 text-green-800',
  REJEITADO: 'bg-orange-100 text-orange-700',
  CANCELADO: 'bg-red-100 text-red-700',
  CONCLUIDO: 'bg-blue-100 text-blue-700',
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

function SolicitacaoCard({ ag, onAcao }) {
  const [from, to] = avatarGradient(ag.nomeCliente);
  const initial = ag.nomeCliente?.charAt(0).toUpperCase() ?? '?';
  const [atualizando, setAtualizando] = useState(false);

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
    <div className="flex items-center gap-4 py-4">
      <div
        className="h-11 w-11 shrink-0 rounded-full flex items-center justify-center text-white text-lg font-bold select-none"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        {initial}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-tight">{ag.nomeCliente}</p>
        <p className="text-xs text-muted-foreground">{ag.nomeServico}</p>
        <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
          <CalendarDays className="h-3 w-3" />
          {fmtIntervalo(ag.inicio, ag.fim)}
        </p>
        {ag.numeroPessoas && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Users className="h-3 w-3" /> {ag.numeroPessoas} {ag.numeroPessoas === 1 ? 'pessoa' : 'pessoas'}
          </p>
        )}
      </div>

      {ag.status === 'PENDENTE' && (
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            disabled={atualizando}
            onClick={() => acao(rejeitarAgendamento, 'rejeitado')}
          >
            {atualizando ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Rejeitar'}
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            disabled={atualizando}
            onClick={() => acao(confirmarAgendamento, 'confirmado')}
          >
            {atualizando ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirmar'}
          </Button>
        </div>
      )}

      {ag.status !== 'PENDENTE' && (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_CLASS[ag.status]}`}>
          {STATUS_LABEL[ag.status]}
        </span>
      )}
    </div>
  );
}

export default function Solicitacoes() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pendentes');

  async function fetchAgendamentos() {
    setLoading(true);
    try {
      const { data } = await listarAgendamentosPrestador();
      setAgendamentos(data);
    } catch {
      toast.error('Erro ao carregar solicitações.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAgendamentos(); }, []);

  const pendentes = agendamentos.filter((a) => a.status === 'PENDENTE');
  const historico = agendamentos.filter((a) => a.status !== 'PENDENTE');
  const lista = activeTab === 'pendentes' ? pendentes : historico;

  const tabs = [
    { key: 'pendentes', label: 'Pendentes', count: pendentes.length },
    { key: 'historico', label: 'Histórico', count: null },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <h1 className="text-xl font-bold flex items-center gap-2 mb-6">
        <ClipboardList className="h-5 w-5" />
        Solicitações
      </h1>

      <div className="flex gap-1 mb-6 border-b">
        {tabs.map(({ key, label, count }) => (
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
            {count !== null && count > 0 && (
              <span className="ml-1.5 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!loading && lista.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">
            {activeTab === 'pendentes' ? 'Nenhuma solicitação pendente.' : 'Nenhum histórico ainda.'}
          </p>
        </div>
      )}

      {!loading && lista.length > 0 && (
        <Card>
          <CardContent className="p-4 divide-y divide-border">
            {lista.map((ag) => (
              <SolicitacaoCard key={ag.id} ag={ag} onAcao={fetchAgendamentos} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
