import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../contexts/AuthContext';
// import api from '@/lib/api';

const schema = z.object({
  nome: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  descricao: z.string().max(1000, 'A descrição deve ter no máximo 1000 caracteres').optional(),
  preco: z.coerce.number().min(0.01, 'O preço deve ser maior que zero'),
  categoria: z.string().min(1, 'Selecione uma categoria'),
  cidade: z.string().min(2, 'Informe a cidade de atuação'),
  tipoCobranca: z.string().min(1, 'Selecione a forma de cobrança'),
  imagemCapa: z.string().url('Insira uma URL válida para a imagem').optional().or(z.literal('')),
  disponivel: z.boolean().default(true),
});

export default function ServiceRegister() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      disponivel: true,
      imagemCapa: ''
    }
  });

  async function onSubmit(values) {
    setFormError('');
    try {
      const payload = {
        ...values,
        usuarioId: user?.id
      };
      
      await api.post('/catalogo', payload);
      toast.success('Serviço cadastrado com sucesso!');
      navigate('/services');
      
    } catch (err) {
      const mensagem = err.response?.data?.erro || 'Erro ao cadastrar o serviço.';
      setFormError(mensagem);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Novo Serviço</h1>
        <p className="mt-2 text-muted-foreground">Preencha os detalhes para anunciar no Festly.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card p-6 border rounded-lg shadow-sm">
        {formError && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
            {formError}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Coluna 1 */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome do Serviço</label>
              <Input placeholder="Ex: Fotografia de Casamento Premium" {...register('nome')} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Categoria</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('categoria')}
              >
                <option value="">Selecione...</option>
                <option value="DECORACAO">Decoração</option>
                <option value="BUFFET">Buffet</option>
                <option value="SOM_ILUMINACAO">Som e Iluminação</option>
                <option value="FOTOGRAFIA">Fotografia</option>
                <option value="BOLOS_DOCES">Bolos e Doces</option>
                <option value="ANIMACAO">Animação</option>
              </select>
              {errors.categoria && <p className="text-xs text-destructive">{errors.categoria.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cidade de Atuação</label>
              <Input placeholder="Ex: Mossoró" {...register('cidade')} />
              {errors.cidade && <p className="text-xs text-destructive">{errors.cidade.message}</p>}
            </div>
          </div>

          {/* Coluna 2 */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo de Cobrança</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('tipoCobranca')}
              >
                <option value="">Selecione...</option>
                <option value="POR_EVENTO">Por Evento (Pacote Fixo)</option>
                <option value="POR_PESSOA">Por Pessoa (Convidados)</option>
                <option value="POR_HORA">Por Hora</option>
              </select>
              {errors.tipoCobranca && <p className="text-xs text-destructive">{errors.tipoCobranca.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Preço (R$)</label>
              <Input type="number" step="0.01" placeholder="0.00" {...register('preco')} />
              {errors.preco && <p className="text-xs text-destructive">{errors.preco.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">URL da Imagem de Capa (Opcional)</label>
              <div className="relative">
                <ImagePlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="https://link-da-sua-foto.com/img.jpg" className="pl-9" {...register('imagemCapa')} />
              </div>
              {errors.imagemCapa && <p className="text-xs text-destructive">{errors.imagemCapa.message}</p>}
            </div>
          </div>
        </div>

        {/* Descrição Full Width */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Descrição Detalhada</label>
          <textarea 
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Descreva o que está incluso no serviço..."
            {...register('descricao')}
          />
          {errors.descricao && <p className="text-xs text-destructive">{errors.descricao.message}</p>}
        </div>

        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="disponivel" 
            className="h-4 w-4 rounded border-gray-300 text-primary"
            {...register('disponivel')}
          />
          <label htmlFor="disponivel" className="text-sm font-medium">
            Serviço disponível para contratação imediata
          </label>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => navigate('/services')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Serviço
          </Button>
        </div>
      </form>
    </div>
  );
}