import { Card, CardContent } from '@/components/ui/card';

const CATEGORIA_LABEL = {
  BUFFET: 'Buffet', DJ: 'DJ', DECORACAO: 'Decoração',
  FOTOGRAFIA: 'Fotografia', ILUMINACAO: 'Iluminação', SOM: 'Som',
  SEGURANCA: 'Segurança', ANIMACAO: 'Animação', OUTROS: 'Outros',
};

const COBRANCA_SUFFIX = {
  POR_EVENTO: '/evento', POR_PESSOA: '/pessoa', POR_HORA: '/hora',
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

function formatPrice(preco, tipoCobranca) {
  const formatted = `R$ ${Number(preco).toFixed(2).replace('.', ',')}`;
  const suffix = COBRANCA_SUFFIX[tipoCobranca] ?? '';
  return { formatted, suffix };
}

export default function CatalogoCard({ servico }) {
  const [from, to] = avatarGradient(servico.nome);
  const initial = servico.nome?.charAt(0).toUpperCase() ?? '?';
  const { formatted, suffix } = formatPrice(servico.preco, servico.tipoCobranca);
  const disponivel = servico.disponivel !== false;

  return (
    <Card className={`transition-all hover:shadow-md py-0 ${!disponivel ? 'opacity-60' : ''}`}>
      <CardContent className="p-4 flex gap-4">
        {/* Avatar */}
        <div
          className="h-14 w-14 shrink-0 rounded-xl flex items-center justify-center text-white text-2xl font-bold select-none"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          {initial}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight">{servico.nome}</p>
              <p className="text-xs text-primary mt-0.5">
                {CATEGORIA_LABEL[servico.categoria] ?? servico.categoria}
                {servico.cidade && <> · 📍 {servico.cidade}</>}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-sm">{formatted}</p>
              <p className="text-xs text-muted-foreground">{suffix}</p>
            </div>
          </div>

          {servico.descricao && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
              {servico.descricao}
            </p>
          )}

          <div className="flex items-center gap-3">
            <span className="text-xs text-amber-500">★ <span className="text-muted-foreground">—</span></span>
            {disponivel ? (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                ● Disponível
              </span>
            ) : (
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                Indisponível
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
