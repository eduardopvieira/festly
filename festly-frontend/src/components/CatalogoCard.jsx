import { useState } from 'react';
import { Loader2, Calendar as CalendarIcon, ShoppingCart } from 'lucide-react';
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
import CalendarioBlocos from './CalendarioBlocos';

const CATEGORIA_LABEL = {
  BUFFET: 'Buffet', DJ: 'DJ', DECORACAO: 'Decoração',
  FOTOGRAFIA: 'Fotografia', ILUMINACAO: 'Iluminação', SOM: 'Som',
  SEGURANCA: 'Segurança', ANIMACAO: 'Animação', OUTROS: 'Outros',
};

const COBRANCA_SUFFIX = {
  POR_EVENTO: '/evento', POR_PESSOA: '/pessoa', POR_HORA: '/hora',
};

export default function CatalogoCard({ servico }) {
  const initial = servico.nome?.charAt(0).toUpperCase() ?? '?';
  const { user } = useAuth();
  const { addItems, removeSlot } = useCart();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [salvando, setSalvando] = useState(false);

  function abrirModal() {
    setSelecionados([]);
    setRefreshKey((k) => k + 1);
    setIsModalOpen(true);
  }

  function toggleBloco(bloco) {
    setSelecionados((prev) => {
      const ja = prev.find((b) => b.data === bloco.data && b.hora === bloco.hora);
      if (ja) {
        return prev.filter((b) => !(b.data === bloco.data && b.hora === bloco.hora));
      }
      return [...prev, bloco];
    });
  }

  async function removerMeu(bloco) {
    try {
      await removeSlot(servico.id, bloco.data, bloco.hora);
      toast.success('Removido do carrinho');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erro ao remover do carrinho');
    }
  }

  async function handleAdicionarAoCarrinho() {
    if (!selecionados.length || !user?.id || salvando) return;
    setSalvando(true);
    try {
      await addItems(
        servico.id,
        selecionados.map((b) => ({ dataEvento: b.data, horarioEvento: b.hora }))
      );
      toast.success(`${selecionados.length} horário(s) adicionado(s) ao carrinho!`);
      setSelecionados([]);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erro ao adicionar ao carrinho.';
      toast.error(msg);
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

              {user?.tipoUsuario === 'CLIENTE' && (
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
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Agendar {servico.nome}</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione um ou mais horários disponíveis. Clique em um bloco roxo para removê-lo do carrinho.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <CalendarioBlocos
              servicoId={servico.id}
              selecionados={selecionados}
              onToggleBloco={toggleBloco}
              onRemoverMeu={removerMeu}
              refreshKey={refreshKey}
            />
          </div>

          {selecionados.length > 0 && (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <strong>{selecionados.length}</strong> horário(s) selecionado(s) para adicionar ao carrinho.
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <Button
              onClick={handleAdicionarAoCarrinho}
              disabled={!selecionados.length || salvando}
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
