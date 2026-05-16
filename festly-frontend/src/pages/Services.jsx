import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import CatalogoCard from '../components/CatalogoCard';
import { listarServicos, listarServicosPublicos } from '../services/servicoService';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user, loading: authLoading } = useAuth();

  const [servicos, setServicos] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [cidadeInput, setCidadeInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cidadeTerm, setCidadeTerm] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('TODOS');

  const sentinelaRef = useRef(null);
  const fetchFn = user ? listarServicos : listarServicosPublicos;

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput === '' || searchInput.length >= 3) setSearchTerm(searchInput);
    }, 1000);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (cidadeInput === '' || cidadeInput.length >= 3) setCidadeTerm(cidadeInput);
    }, 1000);
    return () => clearTimeout(t);
  }, [cidadeInput]);

  const carregarPagina = useCallback(async (pagina, substituir = false) => {
    if (pagina === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const { data } = await fetchFn({
        nome: searchTerm,
        cidade: cidadeTerm,
        categoria: categoriaAtiva,
        page: pagina,
      });

      setServicos((prev) => substituir ? data.content : [...prev, ...data.content]);
      setHasMore(!data.last);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [fetchFn, searchTerm, cidadeTerm, categoriaAtiva]);

  // Reinicia sempre que os filtros mudam
  useEffect(() => {
    if (authLoading) return;
    setPage(0);
    setServicos([]);
    setHasMore(true);
    carregarPagina(0, true);
  }, [searchTerm, cidadeTerm, categoriaAtiva, user, authLoading]);

  // Carrega próxima página quando o sentinela fica visível
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setPage((p) => {
            const next = p + 1;
            carregarPagina(next);
            return next;
          });
        }
      },
      { rootMargin: '200px' }
    );

    const el = sentinelaRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, loading, loadingMore, carregarPagina]);

  return (
    <div className="min-h-full">
      {/* Toolbar */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4">
          <div className="flex gap-2 mb-3">
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
          </div>

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
            {servicos.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Nenhum serviço encontrado.</p>
                <p className="text-sm mt-1">Tente termos diferentes ou remova os filtros.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {servicos.map((s) => (
                  <CatalogoCard key={s.id} servico={s} />
                ))}
              </div>
            )}

            {/* Sentinela de scroll infinito */}
            {hasMore && (
              <div ref={sentinelaRef} className="py-4 flex justify-center">
                {loadingMore && (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                )}
              </div>
            )}

            {!hasMore && servicos.length > 0 && (
              <p className="text-center text-xs text-muted-foreground pt-6">
                Todos os serviços foram carregados.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
