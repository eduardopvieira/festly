import { Link } from 'react-router-dom';
import { Briefcase, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  const prestadorActions = [
    {
      icon: Briefcase,
      title: 'Meus Serviços',
      description: 'Visualize e gerencie os serviços que você oferece.',
      to: '/meus-servicos',
      label: 'Ver serviços',
    },
    {
      icon: Plus,
      title: 'Novo Serviço',
      description: 'Adicione um novo serviço ao seu catálogo.',
      to: '/meus-servicos/novo',
      label: 'Adicionar serviço',
    },
  ];

  const clienteActions = [
    {
      icon: Search,
      title: 'Explorar Serviços',
      description: 'Encontre os melhores prestadores para seu evento.',
      to: '/services',
      label: 'Explorar',
    },
  ];

  const actions = user?.tipoUsuario === 'PRESTADOR' ? prestadorActions : clienteActions;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Olá, {user?.nome?.split(' ')[0]}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          {user?.tipoUsuario === 'PRESTADOR'
            ? 'Gerencie seus serviços e alcance mais clientes.'
            : 'Encontre o serviço perfeito para o seu evento.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {actions.map(({ icon: Icon, title, description, to, label }) => (
          <Card key={to} className="py-0 hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
              </div>
              <Link to={to} className="mt-auto">
                <Button size="sm" variant="outline" className="w-full">{label}</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
