import { useState, useEffect } from 'react';
import { ShoppingCart, Check, Loader2, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import api from '../services/api'; 

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
  const { isInCart, addItem } = useCart();
  const inCart = isInCart(servico.id);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [datasOcupadas, setDatasOcupadas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // Busca datas ocupadas ao abrir o modal
  useEffect(() => {
    if (isModalOpen) {
      setLoading(true);
      api.get(`/agendamentos/servico/${servico.id}/ocupados`)
        .then(res => setDatasOcupadas(res.data))
        .catch(() => console.error("Erro ao carregar agenda"))
        .finally(() => setLoading(false));
    }
  }, [isModalOpen, servico.id]);

  const hoje = new Date().toISOString().split('T')[0];
  const ocupada = datasOcupadas.includes(dataSelecionada);
  const dataValida = dataSelecionada && !ocupada && dataSelecionada >= hoje;

  async function handleConfirm() {
    if (!dataValida || adding) return;
    setAdding(true);
    try {
      await addItem(servico.id, dataSelecionada);
      setIsModalOpen(false);
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <Card className="transition-all hover:shadow-md py-0">
        <CardContent className="p-4 flex gap-4">
          {/* Avatar com Gradiente Simples */}
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
                  variant={inCart ? 'secondary' : 'default'}
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setIsModalOpen(true)}
                  disabled={inCart}
                >
                  {inCart ? <Check className="h-3 w-3" /> : <CalendarIcon className="h-3 w-3" />}
                  {inCart ? 'No carrinho' : 'Agendar'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MODAL DE AGENDAMENTO (Centralizado) */}
      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent className="max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Escolha uma data</AlertDialogTitle>
            <AlertDialogDescription>
              Verifique a disponibilidade para <strong>{servico.nome}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data do Evento</label>
              <Input 
                type="date" 
                min={hoje}
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
                className={ocupada ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {loading && <p className="text-xs text-muted-foreground animate-pulse">Consultando agenda...</p>}
              {ocupada && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Data já reservada por outro cliente.
                </p>
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button 
              onClick={handleConfirm} 
              disabled={!dataValida || adding || loading}
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar Agendamento
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}