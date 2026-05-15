import { useState } from 'react';
import { Loader2, Calendar as CalendarIcon, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';
import AgendadorIntervalos from './AgendadorIntervalos';
import { fmtHoraISO } from '@/lib/utils';

const CATEGORIA_LABEL = {
  BUFFET: 'Buffet', DJ: 'DJ', DECORACAO: 'Decoração',
  FOTOGRAFIA: 'Fotografia', ILUMINACAO: 'Iluminação', SOM: 'Som',
  SEGURANCA: 'Segurança', ANIMACAO: 'Animação', OUTROS: 'Outros',
};

const COBRANCA_SUFFIX = {
  POR_EVENTO: '/evento', POR_PESSOA: '/pessoa', POR_HORA: '/hora',
};

export default function CatalogoCard({ servico }) {
  const navigate = useNavigate();
  const initial = servico.nome?.charAt(0).toUpperCase() ?? '?';
  const { user } = useAuth();
  const { addItems, removeSlot } = useCart();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selecoes, setSelecoes] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [salvando, setSalvando] = useState(false);

  function abrirModal() {
    if (!user) {
      toast.info('Faça login para agendar um serviço.');
      navigate('/login');
      return;
    }
    setSelecoes([]);
    setRefreshKey((k) => k + 1);
    setIsModalOpen(true);
  }

  const mostrarBotaoAgendar = true;

  function adicionarSelecao(inicio, fim) {
    setSelecoes((prev) => {
      const sobrepoe = prev.some((s) => s.inicio < fim && s.fim > inicio);
      if (sobrepoe) {
        toast.error('Esse intervalo se sobrepõe a outro já selecionado.');
        return prev;
      }
      return [...prev, { inicio, fim }];
    });
  }

  function removerSelecao(idx) {
    setSelecoes((prev) => prev.filter((_, i) => i !== idx));
  }

  async function removerMeu(intervalo) {
    try {
      await removeSlot(servico.id, fmtHoraISO(intervalo.inicio), fmtHoraISO(intervalo.fim));
      toast.success('Removido do carrinho');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erro ao remover do carrinho');
    }
  }

  async function handleAdicionarAoCarrinho() {
    if (!selecoes.length || !user?.id || salvando) return;
    setSalvando(true);
    try {
      await addItems(
        servico.id,
        selecoes.map((s) => ({
          inicio: fmtHoraISO(s.inicio),
          fim: fmtHoraISO(s.fim),
        }))
      );
      toast.success(`${selecoes.length} horário(s) adicionado(s) ao carrinho!`);
      setSelecoes([]);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erro ao adicionar ao carrinho.');
      setRefreshKey((k) => k + 1);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <Card className="transition-all hover:shadow-md py-0">
        <CardContent className="p-4 flex gap-4">
          <div className="h-14 w-14 shrink-0 rounded-xl flex items-center justify-center bg-primary text-primary-foreground text-2xl font-bold">
            {initial}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div>
                <p className="font-semibold text-sm leading-tight">{servico.nome}</p>
                <p className="text-xs text-primary mt-0.5">
                  {CATEGORIA_LABEL[servico.categoria] ?? servico.categoria} · {servico.cidade}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-sm">R$ {Number(servico.preco).toFixed(2).replace('.', ',')}</p>
                <p className="text-xs text-muted-foreground">{COBRANCA_SUFFIX[servico.tipoCobranca]}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-4">
              <span className="text-xs text-amber-500">★ <span className="text-muted-foreground">—</span></span>

              {mostrarBotaoAgendar && (
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs gap-1.5"
                  onClick={abrirModal}
                >
                  <CalendarIcon className="h-3 w-3" />
                  Agendar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent
          size="wide"
          className="max-h-[min(92vh,800px)] gap-2 overflow-hidden p-3 sm:max-h-[min(90vh,760px)] sm:p-4 flex flex-col"
        >
          <AlertDialogHeader className="shrink-0 space-y-1 text-left">
            <AlertDialogTitle className="text-base leading-tight">Agendar {servico.nome}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-snug">
              Escolha uma data e o horário desejado. Você pode adicionar múltiplos intervalos.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <AgendadorIntervalos
              servicoId={servico.id}
              selecoes={selecoes}
              onAdicionarSelecao={adicionarSelecao}
              onRemoverSelecao={removerSelecao}
              onRemoverMeu={removerMeu}
              refreshKey={refreshKey}
            />
          </div>

          <AlertDialogFooter className="shrink-0 sm:justify-end">
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <Button
              onClick={handleAdicionarAoCarrinho}
              disabled={!selecoes.length || salvando}
              className="gap-2"
            >
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
              Adicionar ao carrinho
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
