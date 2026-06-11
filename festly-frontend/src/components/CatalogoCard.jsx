import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';
import SolicitarAgendamentoModal from './SolicitarAgendamentoModal';

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
  const { user } = useAuth();
  const { addItem } = useCart();
  const [modalOpen, setModalOpen] = useState(false);

  function abrirModal() {
    if (!user) {
      toast.info('Faça login para agendar um serviço.');
      navigate('/login');
      return;
    }
    setModalOpen(true);
  }

  async function handleAdicionado(payload) {
    try {
      await addItem(servico.id, payload);
      toast.success('Adicionado ao carrinho!');
    } catch (err) {
      toast.error(err.response?.data?.erro ?? 'Erro ao adicionar ao carrinho.');
      throw err;
    }
  }

  const initial = servico.nome?.charAt(0).toUpperCase() ?? '?';

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
                {servico.nomePrestador && (
                  <p className="text-xs text-muted-foreground mt-0.5">{servico.nomePrestador}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-sm">R$ {Number(servico.preco).toFixed(2).replace('.', ',')}</p>
                <p className="text-xs text-muted-foreground">{COBRANCA_SUFFIX[servico.tipoCobranca]}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-4">
              {servico.totalAvaliacoes > 0 ? (
                <span className="text-xs text-amber-500">
                  ★ {Number(servico.notaMedia).toFixed(1)}{' '}
                  <span className="text-muted-foreground">({servico.totalAvaliacoes})</span>
                </span>
              ) : (
                <span className="text-xs text-amber-500">★ <span className="text-muted-foreground">—</span></span>
              )}
              <Button size="sm" variant="default" className="h-7 text-xs gap-1.5" onClick={abrirModal}>
                <CalendarIcon className="h-3 w-3" />
                Adicionar ao carrinho
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <SolicitarAgendamentoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        servico={servico}
        onAdicionado={handleAdicionado}
      />
    </>
  );
}
