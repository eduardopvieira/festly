import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { listarMeusPagamentos } from '../services/pagamentoService';

const STATUS_LABEL = {
  AGUARDANDO: 'Aguardando', CONFIRMADO: 'Confirmado', EXPIRADO: 'Expirado',
  FALHOU: 'Falhou', ESTORNADO_PARCIAL: 'Estornado parcial', ESTORNADO_TOTAL: 'Estornado',
};
const STATUS_CLASS = {
  AGUARDANDO: 'bg-yellow-100 text-yellow-800',
  CONFIRMADO: 'bg-green-100 text-green-800',
  EXPIRADO: 'bg-gray-100 text-gray-600',
  FALHOU: 'bg-red-100 text-red-700',
  ESTORNADO_PARCIAL: 'bg-orange-100 text-orange-700',
  ESTORNADO_TOTAL: 'bg-orange-100 text-orange-700',
};

function fmtMoeda(v) { return `R$ ${Number(v).toFixed(2).replace('.', ',')}`; }
function fmtData(iso) { return iso ? new Date(iso).toLocaleDateString('pt-BR') : ''; }

export default function MeusPagamentos() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [page, setPage] = useState(-1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelaRef = useRef(null);

  const carregar = useCallback(async (pagina) => {
    if (pagina === 0) setLoading(true); else setLoadingMore(true);
    try {
      const { data } = await listarMeusPagamentos({ page: pagina, size: 10 });
      setList((prev) => (pagina === 0 ? data.content : [...prev, ...data.content]));
      setPage(pagina);
      setHasMore(!data.last);
    } catch {
      toast.error('Erro ao carregar pagamentos.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { if (page === -1) carregar(0); }, [page, carregar]);

  useEffect(() => {
    if (!hasMore || loading || loadingMore || page === -1) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) carregar(page + 1);
      },
      { rootMargin: '200px' }
    );
    const el = sentinelaRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, page, loading, loadingMore, carregar]);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <h1 className="text-xl font-bold flex items-center gap-2 mb-6">
        <Wallet className="h-5 w-5" /> Meus Pagamentos
      </h1>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {!loading && list.length === 0 && page >= 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Wallet className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Nenhum pagamento ainda.</p>
        </div>
      )}

      {!loading && list.length > 0 && (
        <Card>
          <CardContent className="p-2 divide-y divide-border">
            {list.map((p) => {
              const clicavel = p.status === 'AGUARDANDO';
              return (
                <button
                  key={p.id}
                  disabled={!clicavel}
                  onClick={() => clicavel && navigate(`/pagamentos/${p.id}`)}
                  className={[
                    'flex items-center gap-4 w-full text-left px-2 py-3 rounded-lg transition-colors',
                    clicavel ? 'hover:bg-muted cursor-pointer' : 'cursor-default',
                  ].join(' ')}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {p.metodo === 'PIX' ? 'PIX' : 'Cartão'} · {fmtMoeda(p.valorTotal)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      #{p.id} · {fmtData(p.createdAt)} · {p.itens?.length ?? 0} {(p.itens?.length ?? 0) === 1 ? 'item' : 'itens'}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_CLASS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                  {clicavel && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {!loading && hasMore && (
        <div ref={sentinelaRef} className="py-4 flex justify-center">
          {loadingMore && <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
        </div>
      )}
    </div>
  );
}
