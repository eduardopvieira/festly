import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../contexts/AuthContext';

const schema = z.object({
  codigo: z.string().length(6, 'O código deve ter 6 dígitos').regex(/^\d+$/, 'Apenas números'),
});

export default function VerifyEmail() {
  const { verify } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values) {
    try {
      const data = await verify(email, values.codigo);
      toast.success('Email verificado com sucesso!');
      const tipo = (data.tipoUsuario ?? data.tipo_usuario ?? '').toUpperCase();
      navigate(tipo === 'CLIENTE' ? '/dashboard/servicos' : '/dashboard');
    } catch (err) {
      const mensagem = err.response?.data?.erro || 'Código inválido ou expirado';
      toast.error(mensagem);
    }
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Verifique seu e-mail</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Enviamos um código de 6 dígitos para{' '}
          <span className="font-medium text-foreground">{email || 'seu e-mail'}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Código de verificação</label>
          <Input
            placeholder="000000"
            maxLength={6}
            className="text-center text-lg tracking-widest"
            {...register('codigo')}
          />
          {errors.codigo && <p className="text-xs text-destructive text-center">{errors.codigo.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verificar
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Não recebeu o código? Verifique a pasta de spam ou{' '}
        <a href="/register" className="text-primary hover:underline">tente se cadastrar novamente</a>.
      </p>
    </div>
  );
}
