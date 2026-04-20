import { Search, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ServicoCard from '../components/ServicoCard';
import { listarServicos } from '../services/servicoService';

const CATEGORIA_LABEL = {
  BUFFET: 'Buffet', DJ: 'DJ', DECORACAO: 'Decoração',
  FOTOGRAFIA: 'Fotografia', ILUMINACAO: 'Iluminação', SOM: 'Som',
  SEGURANCA: 'Segurança', ANIMACAO: 'Animação', OUTROS: 'Outros',
};

export default function Services() {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    listarServicos({ disponivel: true })
      .then(({ data }) => setServicos(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = servicos.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.nome.toLowerCase().includes(term) ||
      (CATEGORIA_LABEL[s.categoria] ?? s.categoria).toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
          <p className="mt-2 text-muted-foreground">Encontre o profissional perfeito para o seu evento.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p className="text-muted-foreground">Não foi possível carregar os serviços. Tente novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
        <p className="mt-2 text-muted-foreground">Encontre o profissional perfeito para o seu evento.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <ServicoCard key={s.id} servico={s} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhum serviço encontrado.</p>
          <p className="text-sm mt-1">Tente buscar com termos diferentes.</p>
        </div>
      )}
    </div>
  );
}
