import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';

const schema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  preco: z.coerce.number({ invalid_type_error: 'Informe um valor numérico' })
    .positive('Preço deve ser maior que zero'),
  tipoCobranca: z.enum(['POR_EVENTO', 'POR_PESSOA', 'POR_HORA'], {
    required_error: 'Selecione o tipo de cobrança',
  }),
  categoria: z.enum(
    ['BUFFET', 'DJ', 'DECORACAO', 'FOTOGRAFIA', 'ILUMINACAO', 'SOM', 'SEGURANCA', 'ANIMACAO', 'OUTROS'],
    { required_error: 'Selecione uma categoria' }
  ),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  descricao: z.string().max(1000, 'Máximo de 1000 caracteres').optional().or(z.literal('')),
  disponivel: z.boolean().default(true),
});

const CATEGORIAS = [
  { value: 'BUFFET', label: 'Buffet' },
  { value: 'DJ', label: 'DJ' },
  { value: 'DECORACAO', label: 'Decoração' },
  { value: 'FOTOGRAFIA', label: 'Fotografia' },
  { value: 'ILUMINACAO', label: 'Iluminação' },
  { value: 'SOM', label: 'Som' },
  { value: 'SEGURANCA', label: 'Segurança' },
  { value: 'ANIMACAO', label: 'Animação' },
  { value: 'OUTROS', label: 'Outros' },
];

const TIPOS_COBRANCA = [
  { value: 'POR_EVENTO', label: 'Por evento' },
  { value: 'POR_PESSOA', label: 'Por pessoa' },
  { value: 'POR_HORA', label: 'Por hora' },
];

export default function ServicoForm({ defaultValues, onSubmit, isSubmitting, titulo, hideDisponivel }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? { disponivel: true },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Nome */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Nome do serviço</label>
        <Input placeholder="Ex: Buffet para 100 pessoas" {...register('nome')} />
        {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
      </div>

      {/* Preço + Tipo de cobrança */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Preço (R$)</label>
          <Input type="number" step="0.01" min="0" placeholder="0,00" {...register('preco')} />
          {errors.preco && <p className="text-xs text-destructive">{errors.preco.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tipo de cobrança</label>
          <Controller
            name="tipoCobranca"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_COBRANCA.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.tipoCobranca && <p className="text-xs text-destructive">{errors.tipoCobranca.message}</p>}
        </div>
      </div>

      {/* Categoria */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Categoria</label>
        <Controller
          name="categoria"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.categoria && <p className="text-xs text-destructive">{errors.categoria.message}</p>}
      </div>

      {/* Cidade */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Cidade</label>
        <Input placeholder="Ex: Mossoró" {...register('cidade')} />
        {errors.cidade && <p className="text-xs text-destructive">{errors.cidade.message}</p>}
      </div>

      {/* Descrição */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Descrição <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <Textarea
          placeholder="Descreva seu serviço, diferenciais, o que está incluído..."
          className="resize-none"
          rows={4}
          {...register('descricao')}
        />
        {errors.descricao && <p className="text-xs text-destructive">{errors.descricao.message}</p>}
      </div>

      {/* Disponível */}
      {!hideDisponivel && <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">Disponível para contratação</p>
          <p className="text-xs text-muted-foreground">
            Serviços disponíveis aparecem no catálogo público.
          </p>
        </div>
        <Controller
          name="disponivel"
          control={control}
          render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando...' : titulo}
      </Button>
    </form>
  );
}
