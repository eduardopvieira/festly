import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { PartyPopper, User, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { useAuth } from '../contexts/AuthContext';

const navLinks = [
  { to: '/services', label: 'Serviços' },
  { to: '/how-it-works', label: 'Como funciona' },
  { to: '/about', label: 'Sobre' },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PartyPopper className="h-4 w-4" />
            </div>
            Festly
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to}>
                <Button
                  variant={isActive(to) ? 'secondary' : 'ghost'}
                  size="sm"
                >
                  {label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  {user.nome || 'Minha conta'}
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Entrar</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Cadastrar</Button>
                </Link>
              </>
            )}
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="flex items-center gap-2 font-bold text-lg">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <PartyPopper className="h-3.5 w-3.5" />
                </div>
                Festly
              </SheetTitle>
              <div className="flex flex-col gap-1 mt-6">
                {navLinks.map(({ to, label }) => (
                  <SheetClose key={to} asChild>
                    <Link to={to}>
                      <Button
                        variant={isActive(to) ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                        size="sm"
                      >
                        {label}
                      </Button>
                    </Link>
                  </SheetClose>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex flex-col gap-2">
                {user ? (
                  <>
                    <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                      <User className="h-4 w-4" />
                      {user.nome || 'Minha conta'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Link to="/login">
                        <Button variant="outline" className="w-full" size="sm">Entrar</Button>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link to="/register">
                        <Button className="w-full" size="sm">Cadastrar</Button>
                      </Link>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-bold text-lg">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <PartyPopper className="h-3.5 w-3.5" />
                </div>
                Festly
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Conectando você aos melhores prestadores de serviços para festas e eventos.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Serviços</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/services?cat=decoracao" className="hover:text-foreground transition-colors">Decoração</Link></li>
                <li><Link to="/services?cat=buffet" className="hover:text-foreground transition-colors">Buffet</Link></li>
                <li><Link to="/services?cat=som" className="hover:text-foreground transition-colors">Som e Iluminação</Link></li>
                <li><Link to="/services?cat=fotografia" className="hover:text-foreground transition-colors">Fotografia</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">Sobre nós</Link></li>
                <li><Link to="/how-it-works" className="hover:text-foreground transition-colors">Como funciona</Link></li>
              </ul>
            </div>
          </div>
          <Separator className="my-8" />
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Festly. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
