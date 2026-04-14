import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../contexts/AuthContext';

const schema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values) {
    setFormError('');
    try {
      await login(values.email, values.password);
      navigate('/');
    } catch (err) {
      const status = err.response?.status;
      const mensagem = err.response?.data?.erro;

      if (status === 403) {
        setFormError('Email não verificado. Confirme seu e-mail antes de entrar.');
        setTimeout(() => navigate(`/verify-email?email=${encodeURIComponent(values.email)}`), 2000);
      } else {
        setFormError(mensagem || 'Email ou senha inválidos');
      }
    }
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Entrar</h1>
        <p className="text-sm text-muted-foreground mt-1">Acesse sua conta Festly</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {formError && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
            {formError}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            placeholder="seu@email.com"
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Senha</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Sua senha"
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Não tem conta?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
