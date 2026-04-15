import { MapPin, PartyPopper } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const CATEGORIA_LABEL = {
  BUFFET: 'Buffet', DJ: 'DJ', DECORACAO: 'Decoração',
  FOTOGRAFIA: 'Fotografia', ILUMINACAO: 'Iluminação', SOM: 'Som',
  SEGURANCA: 'Segurança', ANIMACAO: 'Animação', OUTROS: 'Outros',
};

const COBRANCA_SUFFIX = {
  POR_EVENTO: '', POR_PESSOA: '/pessoa', POR_HORA: '/hora',
};

function formatPrice(preco, tipoCobranca) {
  return `R$ ${Number(preco).toFixed(2).replace('.', ',')}${COBRANCA_SUFFIX[tipoCobranca] ?? ''}`;
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export default function ServicoCard({ servico, acoes }) {
  const temFotos = servico.fotos && servico.fotos.length > 0;

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-md py-0">
      <div className="relative h-36 bg-gradient-to-br from-primary/8 to-primary/3 overflow-hidden">
        {temFotos ? (
          <Carousel className="w-full h-full" opts={{ loop: servico.fotos.length > 1 }}>
            <CarouselContent className="h-36 ml-0">
              {servico.fotos.map((foto) => (
                <CarouselItem key={foto.id} className="pl-0">
                  <img
                    src={`${API_BASE}${foto.url}`}
                    alt={servico.nome}
                    className="w-full h-36 object-cover"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            {servico.fotos.length > 1 && (
              <>
                <CarouselPrevious className="left-2 h-6 w-6" />
                <CarouselNext className="right-2 h-6 w-6" />
              </>
            )}
          </Carousel>
        ) : (
          <div className="flex items-center justify-center h-full">
            <PartyPopper className="h-10 w-10 text-primary/20" />
          </div>
        )}
        {acoes && (
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            {acoes}
          </div>
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <Badge variant="secondary" className="text-xs">
          {CATEGORIA_LABEL[servico.categoria] ?? servico.categoria}
        </Badge>
        <h3 className="font-semibold group-hover:text-primary transition-colors">
          {servico.nome}
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {servico.cidade}
          </span>
        </div>
        <Separator />
        <p className="text-sm font-medium text-primary">
          {formatPrice(servico.preco, servico.tipoCobranca)}
        </p>
      </CardContent>
    </Card>
  );
}
