import { Search, Filter, MapPin, Star, PartyPopper } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const mockServices = [
  { id: 1, name: 'Decorações Encantadas', category: 'Decoração', rating: 4.8, reviews: 124, city: 'Mossoró', price: 'A partir de R$ 1.200' },
  { id: 2, name: 'Buffet Sabor & Arte', category: 'Buffet', rating: 4.9, reviews: 87, city: 'Natal', price: 'A partir de R$ 45/pessoa' },
  { id: 3, name: 'DJ Paulo Silva', category: 'Som e Iluminação', rating: 4.7, reviews: 56, city: 'Apodi', price: 'A partir de R$ 800' },
  { id: 4, name: 'Foto Momentos', category: 'Fotografia', rating: 4.6, reviews: 203, city: 'Parnamirim', price: 'A partir de R$ 1.500' },
  { id: 5, name: 'Doce Festa', category: 'Bolos e Doces', rating: 5.0, reviews: 42, city: 'Caicó', price: 'A partir de R$ 300' },
  { id: 6, name: 'Anima Kids', category: 'Animação', rating: 4.5, reviews: 68, city: 'Açu', price: 'A partir de R$ 500' },
];

export default function Services() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = mockServices.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
        <p className="mt-2 text-muted-foreground">Encontre o profissional perfeito para o seu evento.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((service) => (
          <Card key={service.id} className="group cursor-pointer overflow-hidden transition-all hover:shadow-md py-0">
            <div className="h-36 bg-gradient-to-br from-primary/8 to-primary/3 flex items-center justify-center">
              <PartyPopper className="h-10 w-10 text-primary/20" />
            </div>
            <CardContent className="p-4 space-y-3">
              <Badge variant="secondary" className="text-xs">
                {service.category}
              </Badge>
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                {service.name}
              </h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {service.city}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {service.rating} ({service.reviews})
                </span>
              </div>
              <Separator />
              <p className="text-sm font-medium text-primary">{service.price}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhum serviço encontrado.</p>
          <p className="text-sm mt-1">Tente buscar com termos diferentes.</p>
        </div>
      )}
    </div>
  );
}
