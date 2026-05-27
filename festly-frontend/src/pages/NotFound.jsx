import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary mb-4">404</h1>
      <p className="text-lg sm:text-xl font-medium mb-2">Página não encontrada</p>
      <p className="text-muted-foreground mb-8">
        A página que você está procurando não existe ou foi movida.
      </p>
      <Link to="/">
        <Button className="gap-2">
          <Home className="h-4 w-4" />
          Voltar ao início
        </Button>
      </Link>
    </div>
  );
}
