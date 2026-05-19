import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, User } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import StarRating from '../components/StarRating';
import { listarAvaliacoesDoServico } from '../services/avaliacaoService';
import { buscarServico } from '../services/servicoService';

function fmtData(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MeusServicosAvaliacoes() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [servico, setServico] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [page, setPage] = useState(-1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelaRef = useRef(null);

  useEffect(() => {
    let cancel = false;
    buscarServico(id)
      .then(({ data }) => { if (!cancel) setServico(data); })
      .catch((err) => {
        if (cancel) return;
        if (err.response?.status === 403) {
          toast.error('Você não tem permissão para ver as avaliações deste serviço.');
          navigate('/meus-servicos');
        } else if (err.response?.status === 404) {
          toast.error('Serviço não encontrado.');
          navigate('/meus-servicos');
        } else {
          toast.error('Erro ao carregar o serviço.');
        }
      });
    return () => { cancel = true; };
  }, [id, navigate]);

  const carregarPagina = useCallback(async (pagina) => {
    if (pagina === 0) setLoading(true);
    else setLoadingMore(true);
    try {
      const { data } = await listarAvaliacoesDoServico(id, { page: pagina, size: 10 });
      setAvaliacoes((prev) => pagina === 0 ? data.content : [...prev, ...data.content]);
      setHasMore(!data.last);
      setPage(pagina);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Você não tem permissão para ver as avaliações deste serviço.');
        navigate('/meus-servicos');
      } else {
        toast.error('Erro ao carregar avaliações.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (page === -1) carregarPagina(0);
  }, [page, carregarPagina]);

  useEffect(() => {
    if (!hasMore || loading || loadingMore || page === -1) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          carregarPagina(page + 1);
        }
      },
      { rootMargin: '200px' }
    );
    const el = sentinelaRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, loading, loadingMore, page, carregarPagina]);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <Link to="/meus-servicos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Voltar para Meus Serviços
      </Link>

      {servico && (
        <div className="mb-6">
          <h1 className="text-xl font-bold">{servico.nome}</h1>
          <div className="flex items-center gap-3 mt-2">
            <StarRating value={Math.round(servico.notaMedia ?? 0)} size="md" />
            <span className="text-sm text-muted-foreground">
              {servico.totalAvaliacoes > 0
                ? `${Number(servico.notaMedia).toFixed(1)} · ${servico.totalAvaliacoes} ${servico.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'}`
                : 'Sem avaliações'}
            </span>
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!loading && avaliacoes.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Ainda sem avaliações.</p>
        </div>
      )}

      {!loading && avaliacoes.length > 0 && (
        <Card>
          <CardContent className="p-4 divide-y divide-border">
            {avaliacoes.map((av) => (
              <div key={av.id} className="py-4 flex gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center bg-muted text-muted-foreground select-none">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-muted-foreground italic">Cliente anônimo</p>
                    <span className="text-xs text-muted-foreground">{fmtData(av.createdAt)}</span>
                  </div>
                  <div className="mt-1">
                    <StarRating value={av.nota} size="sm" />
                  </div>
                  {av.comentario && (
                    <p className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap">
                      {av.comentario}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!loading && hasMore && (
        <div ref={sentinelaRef} className="py-4 flex justify-center">
          {loadingMore && (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>
      )}

      {!loading && !hasMore && avaliacoes.length > 0 && (
        <p className="text-center text-xs text-muted-foreground pt-6">
          Todas as avaliações foram carregadas.
        </p>
      )}
    </div>
  );
}
