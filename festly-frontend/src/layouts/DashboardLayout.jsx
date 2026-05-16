import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Briefcase, User, Search, Menu, PartyPopper, LogOut, ShoppingCart, CalendarDays, ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetTrigger, SheetTitle,
} from '@/components/ui/sheet';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const NAV = [
  { icon: Search,       label: 'Explorar Serviços',  to: '/dashboard/servicos' },
  { icon: Briefcase,    label: 'Meus Serviços',      to: '/meus-servicos' },
  { icon: ClipboardList, label: 'Solicitações',      to: '/solicitacoes' },
  { icon: CalendarDays, label: 'Meus Agendamentos',  to: '/meus-agendamentos' },
  { icon: User,         label: 'Perfil',             to: '/perfil' },
];

function SidebarNav({ navItems, collapsed, isActive, onItemClick }) {
  return (
    <nav className="flex flex-col py-4 h-full">
      <div className={`px-3 mb-3 ${collapsed ? 'hidden' : ''}`}>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Painel
        </span>
      </div>
      <div className="space-y-0.5 px-2">
        {navItems.map(({ icon: Icon, label, to }) => (
          <Link key={to} to={to} onClick={onItemClick}>
            <Button
              variant={isActive(to) ? 'secondary' : 'ghost'}
              size="sm"
              title={collapsed ? label : undefined}
              className={[
                'w-full gap-3',
                collapsed ? 'justify-center px-2' : 'justify-start',
                isActive(to) ? 'border-l-2 border-primary rounded-l-none pl-[calc(0.5rem-2px)]' : '',
              ].join(' ')}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Button>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default function DashboardLayout() {
  const { user, loading, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!loading && user && /^\/dashboard\/?$/.test(location.pathname)) {
      navigate('/dashboard/servicos');
    }
  }, [loading, user, location.pathname, navigate]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const navItems = NAV;

  const isActive = (to) =>
    to === '/dashboard'
      ? location.pathname === to
      : location.pathname.startsWith(to);

  function handleLogout() {
    logout();
    navigate('/');
  }

  const avatar = user.nome?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-3 px-4">
          {/* Toggle desktop */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden md:flex"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Drawer mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="flex items-center gap-2 px-4 py-4 font-bold text-lg border-b">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <PartyPopper className="h-3.5 w-3.5" />
                </div>
                Festly
              </SheetTitle>
              <SidebarNav
                navItems={navItems}
                collapsed={false}
                isActive={isActive}
                onItemClick={() => {}}
              />
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PartyPopper className="h-4 w-4" />
            </div>
            Festly
          </Link>

          {/* User info */}
          <div className="ml-auto flex items-center gap-2">
            {(
              <Link to="/dashboard/carrinho">
                <Button variant="ghost" size="icon-sm" className="relative" aria-label="Carrinho">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                      {itemCount > 9 ? '9+' : itemCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold select-none">
              {avatar}
            </div>
            <span className="hidden sm:block text-sm font-medium">{user.nome}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleLogout}
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar desktop */}
        <aside
          className={[
            'hidden md:flex flex-col border-r bg-muted/20 transition-[width] duration-200 overflow-hidden shrink-0',
            sidebarOpen ? 'w-56' : 'w-14',
          ].join(' ')}
        >
          <SidebarNav
            navItems={navItems}
            collapsed={!sidebarOpen}
            isActive={isActive}
            onItemClick={() => {}}
          />
        </aside>

        {/* Conteúdo */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
