import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';

const CATEGORIA_LABEL = {
  BUFFET: 'Buffet', DJ: 'DJ', DECORACAO: 'Decoração',
  FOTOGRAFIA: 'Fotografia', ILUMINACAO: 'Iluminação', SOM: 'Som',
  SEGURANCA: 'Segurança', ANIMACAO: 'Animação', OUTROS: 'Outros',
};

const AVATAR_GRADIENTS = [
  ['#7c3aed', '#a78bfa'],
  ['#0284c7', '#38bdf8'],
  ['#d97706', '#fb923c'],
  ['#059669', '#34d399'],
  ['#e11d48', '#fb7185'],
  ['#4338ca', '#818cf8'],
];

function avatarGradient(nome) {
  const code = (nome?.charCodeAt(0) ?? 0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[code];
}

function CartItem({ servico, onRemove }) {
  const [from, to] = avatarGradient(servico.nome);
  const initial = servico.nome?.charAt(0).toUpperCase() ?? '?';
  const price = `R$ ${Number(servico.preco).toFixed(2).replace('.', ',')}`;

  return (
    <div className="flex items-center gap-4 py-4">
      <div
        className="h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white text-xl font-bold select-none"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        {initial}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-tight">{servico.nome}</p>
        <p className="text-xs text-primary mt-0.5">
          {CATEGORIA_LABEL[servico.categoria] ?? servico.categoria}
          {servico.cidade && <> · {servico.cidade}</>}
        </p>
      </div>

      <div className="text-right shrink-0 mr-2">
        <p className="font-bold text-sm">{price}</p>
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onRemove(servico.id)}
        aria-label="Remover"
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function Carrinho() {
  const { items, total, loading, removeItem, clearCart } = useCart();

  async function handleRemove(servicoId) {
    try {
      await removeItem(servicoId);
    } catch {
      toast.error('Erro ao remover serviço do carrinho.');
    }
  }

  async function handleClear() {
    try {
      await clearCart();
      toast.success('Carrinho limpo.');
    } catch {
      toast.error('Erro ao limpar o carrinho.');
    }
  }

  function handleSolicitar() {
    toast.info('Funcionalidade de solicitação de orçamentos em breve!');
  }

  const formattedTotal = `R$ ${Number(total).toFixed(2).replace('.', ',')}`;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Meu Carrinho
        </h1>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground text-xs">
            Limpar tudo
          </Button>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Seu carrinho está vazio.</p>
          <p className="text-sm mt-1 mb-6">Explore o catálogo e adicione serviços.</p>
          <Link to="/dashboard/servicos">
            <Button size="sm" className="gap-2">
              <Search className="h-4 w-4" />
              Explorar serviços
            </Button>
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <Card>
          <CardContent className="p-4 divide-y divide-border">
            {items.map((servico) => (
              <CartItem key={servico.id} servico={servico} onRemove={handleRemove} />
            ))}
          </CardContent>

          <Separator />

          <div className="px-4 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? 'serviço' : 'serviços'}
              </span>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total estimado</p>
                <p className="text-lg font-bold">{formattedTotal}</p>
              </div>
            </div>

            <Button className="w-full" onClick={handleSolicitar}>
              Solicitar orçamentos
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
