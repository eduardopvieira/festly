import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '../contexts/AuthContext';

export default function Perfil() {
  const { user } = useAuth();

  const avatar = user?.nome?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Meu Perfil</h1>

      <Card className="py-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold select-none">
              {avatar}
            </div>
            <div>
              <p className="text-xl font-semibold">{user?.nome}</p>
              <Badge variant="secondary" className="mt-1">
                {user?.tipoUsuario === 'PRESTADOR' ? 'Prestador' : 'Cliente'}
              </Badge>
            </div>
          </div>

          <Separator className="mb-6" />

          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Nome completo
              </dt>
              <dd className="text-sm">{user?.nome}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                E-mail
              </dt>
              <dd className="text-sm">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Tipo de conta
              </dt>
              <dd className="text-sm">
                {user?.tipoUsuario === 'PRESTADOR' ? 'Prestador de serviços' : 'Cliente'}
              </dd>
            </div>
          </dl>

          <Separator className="my-6" />

          <p className="text-xs text-muted-foreground">
            Edição de perfil em breve disponível.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
