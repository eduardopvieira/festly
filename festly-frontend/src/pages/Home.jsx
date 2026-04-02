import { Link } from 'react-router-dom';
import {
  PartyPopper,
  Search,
  Star,
  ShieldCheck,
  Palette,
  UtensilsCrossed,
  Music,
  Camera,
  Cake,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  TrendingUp,
  Clock,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const categories = [
  { icon: Palette, name: 'Decoração', slug: 'decoracao', count: '240+ profissionais' },
  { icon: UtensilsCrossed, name: 'Buffet & Gastronomia', slug: 'buffet', count: '180+ profissionais' },
  { icon: Music, name: 'Som & Iluminação', slug: 'som', count: '120+ profissionais' },
  { icon: Camera, name: 'Fotografia & Vídeo', slug: 'fotografia', count: '300+ profissionais' },
  { icon: Cake, name: 'Bolos & Confeitaria', slug: 'bolos', count: '150+ profissionais' },
  { icon: Sparkles, name: 'Animação & Recreação', slug: 'animacao', count: '90+ profissionais' },
];

const steps = [
  {
    icon: Search,
    title: 'Busque o serviço ideal',
    description: 'Encontre prestadores filtrando por categoria, localização, avaliações e faixa de preço.',
  },
  {
    icon: CheckCircle2,
    title: 'Compare e escolha',
    description: 'Analise portfólios, leia avaliações verificadas e compare orçamentos lado a lado.',
  },
  {
    icon: ShieldCheck,
    title: 'Contrate com segurança',
    description: 'Feche negócio diretamente na plataforma com comunicação protegida e suporte dedicado.',
  },
];

const stats = [
  { value: '2.000+', label: 'Prestadores verificados', icon: Users },
  { value: '15.000+', label: 'Eventos realizados', icon: PartyPopper },
  { value: '4.9/5', label: 'Avaliação média', icon: Star },
  { value: '<2h', label: 'Tempo médio de resposta', icon: Clock },
];

const testimonials = [
  {
    name: 'Ana Carolina',
    role: 'Organizou casamento',
    rating: 5,
    text: 'Encontrei todos os fornecedores do meu casamento pela Festly. A decoração ficou exatamente como sonhei! Processo super fácil e seguro.',
    city: 'Mossoró, RN',
  },
  {
    name: 'Roberto Lima',
    role: 'Festa corporativa',
    rating: 5,
    text: 'Organizamos o evento anual da empresa em tempo recorde. A plataforma facilitou muito a comparação entre prestadores.',
    city: 'Natal, RN',
  },
  {
    name: 'Mariana Santos',
    role: 'Aniversário infantil',
    rating: 5,
    text: 'A festa do meu filho foi incrível! O buffet e a animação que encontrei aqui foram perfeitos. Super recomendo a plataforma.',
    city: 'Apodi, RN',
  },
];

const featured = [
  { name: 'Studio Flores & Cores', category: 'Decoração', rating: 4.9, reviews: 234, city: 'Mossoró', price: 'A partir de R$ 1.200' },
  { name: 'Buffet Sabor & Arte', category: 'Buffet', rating: 4.8, reviews: 187, city: 'Natal', price: 'A partir de R$ 45/pessoa' },
  { name: 'DJ Marcos Vieira', category: 'Som & Iluminação', rating: 4.9, reviews: 156, city: 'Parnamirim', price: 'A partir de R$ 800' },
  { name: 'Lens Fotografia', category: 'Fotografia', rating: 5.0, reviews: 312, city: 'Caicó', price: 'A partir de R$ 1.500' },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-festly-100)_0%,_transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Sua festa perfeita{' '}
              <span className="text-primary">começa aqui</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Conectamos você aos melhores prestadores de serviços para casamentos,
              aniversários, eventos corporativos e muito mais — tudo em um só lugar.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center gap-3 max-w-lg mx-auto">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="O que você está buscando?"
                  className="pl-10 h-11 bg-background"
                />
              </div>
              <Link to="/services">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  Buscar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Cadastro gratuito
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Prestadores verificados
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Pagamento seguro
              </span>
            </div>
          </div>
        </div>
      </section>

    

      {/* Categories */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Explore por categoria
            </h2>
            <p className="mt-3 text-muted-foreground">
              Tudo que você precisa para o seu evento, organizado e fácil de encontrar.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(({ icon: Icon, name, slug, count }) => (
              <Link key={slug} to={`/services?cat=${slug}`}>
                <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30 py-0">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{count}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 bg-muted/30 border-y">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              Simples e rápido
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Como funciona
            </h2>
            <p className="mt-3 text-muted-foreground">
              Em três passos simples, encontre o profissional ideal para o seu evento.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(({ icon: Icon, title, description }, index) => (
              <div key={title} className="relative text-center">
                <div className="flex flex-col items-center">
                  <div className="relative mb-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-amber-950">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured providers */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Destaques
              </h2>
              <p className="mt-2 text-muted-foreground">
                Prestadores mais bem avaliados da plataforma.
              </p>
            </div>
            <Link to="/services" className="hidden sm:block">
              <Button variant="outline" size="sm" className="gap-1.5">
                Ver todos
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((provider) => (
              <Card key={provider.name} className="group cursor-pointer overflow-hidden transition-all hover:shadow-md py-0">
                <div className="h-36 bg-gradient-to-br from-primary/8 to-primary/3 flex items-center justify-center">
                  <PartyPopper className="h-10 w-10 text-primary/20" />
                </div>
                <CardContent className="p-4 space-y-3">
                  <Badge variant="secondary" className="text-xs">
                    {provider.category}
                  </Badge>
                  <h3 className="font-semibold group-hover:text-primary transition-colors leading-tight">
                    {provider.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {provider.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {provider.rating} ({provider.reviews})
                    </span>
                  </div>
                  <Separator />
                  <p className="text-sm font-medium text-primary">{provider.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 sm:hidden text-center">
            <Link to="/services">
              <Button variant="outline" className="gap-1.5">
                Ver todos os serviços
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 bg-muted/30 border-y">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              O que dizem nossos clientes
            </h2>
            <p className="mt-3 text-muted-foreground">
              Milhares de eventos organizados com sucesso através da Festly.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="py-0">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    "{testimonial.text}"
                  </p>
                  <Separator />
                  <div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.role} · {testimonial.city}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for providers */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 py-0">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-1 text-center lg:text-left">
                  <Badge className="mb-4 gap-1.5">
                    <TrendingUp className="h-3 w-3" />
                    Para prestadores
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Expanda seu negócio com a Festly
                  </h2>
                  <p className="mt-3 text-muted-foreground max-w-lg leading-relaxed">
                    Cadastre-se gratuitamente, crie seu portfólio e conecte-se com milhares
                    de clientes buscando serviços para eventos em todo o Brasil.
                  </p>
                  <ul className="mt-6 space-y-2 text-sm">
                    {[
                      'Perfil profissional personalizado',
                      'Receba solicitações de orçamento diretamente',
                      'Sistema de avaliações para construir reputação',
                      'Sem mensalidade — pague apenas por contratação',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-3 shrink-0">
                  <Link to="/register">
                    <Button size="lg" className="gap-2 w-full">
                      Cadastrar como prestador
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <p className="text-xs text-muted-foreground text-center">
                    Grátis para começar · Sem compromisso
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 border-t bg-muted/30">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-6">
            <PartyPopper className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Pronto para organizar sua festa?
          </h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            Junte-se a milhares de pessoas que já encontraram os melhores serviços para seus eventos.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/services">
              <Button size="lg" className="gap-2">
                <Search className="h-4 w-4" />
                Encontrar serviços
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="gap-2">
                Criar conta grátis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
