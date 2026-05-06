import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import CatalogoCard from '../components/CatalogoCard';
import { listarServicosPublicos } from '../services/servicoService';

const CATEGORIAS = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'BUFFET', label: 'Buffet' },
  { value: 'DECORACAO', label: 'Decoração' },
  { value: 'FOTOGRAFIA', label: 'Fotografia' },
  { value: 'DJ', label: 'DJ' },
  { value: 'ILUMINACAO', label: 'Iluminação' },
  { value: 'SOM', label: 'Som' },
  { value: 'ANIMACAO', label: 'Animação' },
  { value: 'SEGURANCA', label: 'Segurança' },
  { value: 'OUTROS', label: 'Outros' },
];

export default function Services() {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [cidadeInput, setCidadeInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cidadeTerm, setCidadeTerm] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('TODOS');

  useEffect(() => {
    setLoading(true);

    const filtrosAtivos = {
      nome: searchTerm,
      cidade: cidadeTerm,
      categoria: categoriaAtiva
    };

    listarServicosPublicos(filtrosAtivos)
      .then(({ data }) => {
        setServicos(data);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));

  }, [searchTerm, cidadeTerm, categoriaAtiva]);

  function handleBuscar(e) {
    e.preventDefault();
    setSearchTerm(searchInput);
    setCidadeTerm(cidadeInput);
  }

  const filtered = servicos;

  return (
    <div className="min-h-full">
      {/* Toolbar */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4">
          <form onSubmit={handleBuscar} className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou serviço..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Input
              placeholder="Cidade"
              value={cidadeInput}
              onChange={(e) => setCidadeInput(e.target.value)}
              className="w-32 sm:w-40"
            />
            <Button type="submit">Buscar</Button>
          </form>

          {/* Chips de categoria */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIAS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setCategoriaAtiva(value)}
                className={[
                  'text-xs px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap',
                  categoriaAtiva === value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-20 text-muted-foreground">
            <p>Não foi possível carregar os serviços. Tente novamente mais tarde.</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {filtered.length} {filtered.length === 1 ? 'serviço encontrado' : 'serviços encontrados'}
            </p>

            {filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Nenhum serviço encontrado.</p>
                <p className="text-sm mt-1">Tente termos diferentes ou remova os filtros.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((s) => (
                  <CatalogoCard key={s.id} servico={s} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
