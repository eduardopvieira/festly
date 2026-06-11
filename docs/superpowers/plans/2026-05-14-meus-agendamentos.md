# Meus Agendamentos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar página "Meus Agendamentos" para clientes visualizarem agendamentos em abas (Ativos / Histórico) e cancelarem com diálogo de confirmação.

**Architecture:** Frontend only. Backend e serviço JS (`agendamentoService.js`) já estão completos. Três mudanças: nova página `MeusAgendamentos.jsx`, nova rota em `routes/index.jsx`, novo item de navegação em `DashboardLayout.jsx`.

**Tech Stack:** React 18, Vite, Tailwind CSS, shadcn/ui (Base UI), lucide-react, sonner (toasts), react-router-dom v7

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `festly-frontend/src/pages/MeusAgendamentos.jsx` | Criar | Página completa: abas, cards, AlertDialog |
| `festly-frontend/src/routes/index.jsx` | Modificar | Adicionar rota `/meus-agendamentos` |
| `festly-frontend/src/layouts/DashboardLayout.jsx` | Modificar | Adicionar item nav para CLIENTE |

---

## Task 1: Criar página MeusAgendamentos.jsx

**Files:**
- Create: `festly-frontend/src/pages/MeusAgendamentos.jsx`

- [ ] **Step 1: Criar o arquivo com o componente completo**

Criar `festly-frontend/src/pages/MeusAgendamentos.jsx` com o seguinte conteúdo:

```jsx
import { useState, useEffect } from 'react';
import { CalendarDays, Search, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '../contexts/AuthContext';
import { listarAgendamentosCliente, cancelarAgendamento } from '../services/agendamentoService';

const STATUS_LABEL = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  CONCLUIDO: 'Concluído',
};

const STATUS_CLASS = {
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  CONFIRMADO: 'bg-green-100 text-green-800',
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
  const dataFim = fim.toLocaleDateString('pt-BR');
  const hi = `${String(ini.getHours()).padStart(2, '0')}:${String(ini.getMinutes()).padStart(2, '0')}`;
  const hf = `${String(fim.getHours()).padStart(2, '0')}:${String(fim.getMinutes()).padStart(2, '0')}`;
  if (data === dataFim) return `${data} · ${hi} → ${hf}`;
  return `${data} ${hi} → ${dataFim} ${hf}`;
}

function AgendamentoCard({ agendamento, onCancelClick, isCanceling }) {
  const [from, to] = avatarGradient(agendamento.nomeServico);
  const initial = agendamento.nomeServico?.charAt(0).toUpperCase() ?? '?';
  const canCancel = agendamento.status === 'PENDENTE' || agendamento.status === 'CONFIRMADO';

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
      </div>

      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_CLASS[agendamento.status]}`}
      >
        {STATUS_LABEL[agendamento.status]}
      </span>

      {canCancel && (
        <Button
          variant="ghost"
          size="sm"
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

export default function MeusAgendamentos() {
  const { user } = useAuth();
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ativos');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);

  async function fetchAgendamentos() {
    try {
      const { data } = await listarAgendamentosCliente(user.id);
      setAgendamentos(data);
    } catch {
      toast.error('Erro ao carregar agendamentos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAgendamentos();
  }, []);

  async function handleConfirmCancel() {
    if (!cancelTarget) return;
    const target = cancelTarget;
    setCancelTarget(null);
    setCancelingId(target.id);
    try {
      await cancelarAgendamento(target.id, user.id);
      toast.success('Agendamento cancelado.');
      setLoading(true);
      await fetchAgendamentos();
    } catch (err) {
      const msg = err.response?.data?.erro || 'Erro ao cancelar agendamento.';
      toast.error(msg);
    } finally {
      setCancelingId(null);
    }
  }

  const ativos = agendamentos.filter(
    (a) => a.status === 'PENDENTE' || a.status === 'CONFIRMADO'
  );
  const historico = agendamentos.filter(
    (a) => a.status === 'CANCELADO' || a.status === 'CONCLUIDO'
  );
  const lista = activeTab === 'ativos' ? ativos : historico;

  const tabs = [
    { key: 'ativos', label: 'Ativos', count: ativos.length },
    { key: 'historico', label: 'Histórico', count: null },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <h1 className="text-xl font-bold flex items-center gap-2 mb-6">
        <CalendarDays className="h-5 w-5" />
        Meus Agendamentos
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
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!loading && lista.length === 0 && (
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

      {!loading && lista.length > 0 && (
        <Card>
          <CardContent className="p-4 divide-y divide-border">
            {lista.map((ag) => (
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
              {cancelTarget && (
                <> em {fmtIntervalo(cancelTarget.inicio, cancelTarget.fim)}</>
              )}? Esta ação não pode ser desfeita.
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
```

- [ ] **Step 2: Commit**

```bash
git add festly-frontend/src/pages/MeusAgendamentos.jsx
git commit -m "feat: add MeusAgendamentos page with tabs and cancel dialog"
```

---

## Task 2: Registrar rota `/meus-agendamentos`

**Files:**
- Modify: `festly-frontend/src/routes/index.jsx`

- [ ] **Step 1: Adicionar import e rota**

No topo do arquivo `festly-frontend/src/routes/index.jsx`, adicionar o import:

```js
import MeusAgendamentos from '../pages/MeusAgendamentos';
```

No array de rotas, dentro do bloco `element: <DashboardLayout />`, adicionar após a rota do carrinho:

```jsx
{ path: '/meus-agendamentos', element: <MeusAgendamentos /> },
```

O bloco de rotas do DashboardLayout ficará assim:

```jsx
{
  element: <DashboardLayout />,
  children: [
    { path: '/dashboard', element: <Dashboard /> },
    { path: '/dashboard/servicos', element: <Services /> },
    { path: '/perfil', element: <Perfil /> },
    { path: '/meus-servicos', element: <MeusServicos /> },
    { path: '/meus-servicos/novo', element: <NovoServico /> },
    { path: '/meus-servicos/editar/:id', element: <EditarServico /> },
    { path: '/dashboard/carrinho', element: <Carrinho /> },
    { path: '/meus-agendamentos', element: <MeusAgendamentos /> },
  ],
},
```

- [ ] **Step 2: Commit**

```bash
git add festly-frontend/src/routes/index.jsx
git commit -m "feat: register /meus-agendamentos route"
```

---

## Task 3: Adicionar item de navegação para clientes

**Files:**
- Modify: `festly-frontend/src/layouts/DashboardLayout.jsx`

- [ ] **Step 1: Adicionar CalendarDays ao import de lucide-react**

Na linha de imports de `lucide-react` em `DashboardLayout.jsx`, adicionar `CalendarDays`:

```js
import {
  LayoutDashboard, Briefcase, User, Globe, Search, Menu, PartyPopper, LogOut, ShoppingCart, CalendarDays,
} from 'lucide-react';
```

- [ ] **Step 2: Adicionar item ao CLIENTE_NAV**

Localizar a constante `CLIENTE_NAV` e adicionar o item de agendamentos:

```js
const CLIENTE_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: Search,          label: 'Explorar Serviços', to: '/dashboard/servicos' },
  { icon: CalendarDays,    label: 'Meus Agendamentos', to: '/meus-agendamentos' },
  { icon: User,            label: 'Perfil', to: '/perfil' },
];
```

- [ ] **Step 3: Commit**

```bash
git add festly-frontend/src/layouts/DashboardLayout.jsx
git commit -m "feat: add Meus Agendamentos nav item for clients"
```

---

## Task 4: Verificação manual no browser

- [ ] **Step 1: Subir o frontend**

```bash
cd festly-frontend
npm run dev
```

- [ ] **Step 2: Verificar navegação**

1. Logar como usuário CLIENTE
2. Verificar que "Meus Agendamentos" aparece na sidebar
3. Clicar no item e confirmar que abre `/meus-agendamentos`

- [ ] **Step 3: Verificar lista de agendamentos**

Com agendamentos existentes no banco:
- Aba "Ativos" exibe agendamentos com status PENDENTE ou CONFIRMADO
- Aba "Histórico" exibe agendamentos com status CANCELADO ou CONCLUIDO
- Badge de status aparece com a cor correta
- Data e hora formatados em pt-BR

- [ ] **Step 4: Verificar estado vazio**

Com cliente sem agendamentos:
- Aba "Ativos": exibe ícone + mensagem + botão "Explorar serviços"
- Aba "Histórico": exibe ícone + "Nenhum agendamento anterior."

- [ ] **Step 5: Verificar cancelamento**

1. Clicar em "Cancelar" em um agendamento ativo
2. AlertDialog abre com nome do serviço e horário
3. Clicar "Manter agendamento" → dialog fecha, nada muda
4. Clicar "Cancelar" novamente → "Sim, cancelar" → toast de sucesso, agendamento migra para aba Histórico
