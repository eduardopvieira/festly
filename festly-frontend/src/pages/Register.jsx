import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { maskCpf, maskCnpj, isValidCpf, isValidCnpj } from '@/lib/validators';

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmarSenha: z.string(),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
})
  .refine(data => data.senha === data.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  })
  .refine(data => {
    const temCpf = data.cpf && data.cpf.replace(/\D/g, '').length > 0;
    const temCnpj = data.cnpj && data.cnpj.replace(/\D/g, '').length > 0;
    return temCpf || temCnpj;
  }, {
    message: 'Informe o CPF ou CNPJ.',
    path: ['cpf'],
  })
  .refine(data => {
    if (!data.cpf || data.cpf.replace(/\D/g, '').length === 0) return true;
    return isValidCpf(data.cpf);
  }, { message: 'CPF inválido', path: ['cpf'] })
  .refine(data => {
    if (!data.cnpj || data.cnpj.replace(/\D/g, '').length === 0) return true;
    return isValidCnpj(data.cnpj);
  }, { message: 'CNPJ inválido', path: ['cnpj'] });

function getPasswordStrength(password) {
  if (!password || password.length < 6) return null;
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (password.length < 8 || !hasLetters || !hasNumbers) {
    return { label: 'Fraca', color: 'bg-red-500', width: 'w-1/3' };
  }
  if (hasLetters && hasNumbers && !hasSpecial) {
    return { label: 'Média', color: 'bg-yellow-500', width: 'w-2/3' };
  }
  return { label: 'Forte', color: 'bg-green-500', width: 'w-full' };
}

export default function Register() {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [senhaValue, setSenhaValue] = useState('');
  const [formError, setFormError] = useState('');

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
      confirmarSenha: '',
      cpf: '',
      cnpj: '',
    }
  });

  const strength = getPasswordStrength(senhaValue);

  async function onSubmit(values) {
    setFormError('');
    try {
      const payload = {
        nome: values.nome,
        email: values.email,
        senha: values.senha,
        cpf: values.cpf ? values.cpf.replace(/\D/g, '') || null : null,
        cnpj: values.cnpj ? values.cnpj.replace(/\D/g, '') || null : null,
      };
      await registerAuth(payload);
      toast.success('Cadastro realizado! Verifique seu e-mail.');
      navigate(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (err) {
      const mensagem = err.response?.data?.erro || 'Erro ao realizar cadastro';
      setFormError(mensagem);
    }
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Criar conta</h1>
        <p className="text-sm text-muted-foreground mt-1">Junte-se à Festly gratuitamente</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {formError && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
            {formError}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nome completo</label>
          <Input placeholder="Seu nome" {...register('nome')} />
          {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Email</label>
          <Input type="email" placeholder="seu@email.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Senha</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 6 caracteres"
              className="pr-10"
              {...register('senha', {
                onChange: (e) => setSenhaValue(e.target.value),
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {strength && (
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
              </div>
              <p className="text-xs text-muted-foreground">Força da senha: <span className="font-medium">{strength.label}</span></p>
            </div>
          )}
          {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Confirmar senha</label>
          <div className="relative">
            <Input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repita a senha"
              className="pr-10"
              {...register('confirmarSenha')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmarSenha && <p className="text-xs text-destructive">{errors.confirmarSenha.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">CPF <span className="text-muted-foreground font-normal">(pessoa física)</span></label>
            <Input
              placeholder="000.000.000-00"
              {...register('cpf')}
              onChange={(e) => {
                const masked = maskCpf(e.target.value);
                e.target.value = masked;
                setValue('cpf', masked);
              }}
            />
            {errors.cpf && <p className="text-xs text-destructive">{errors.cpf.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">CNPJ <span className="text-muted-foreground font-normal">(empresa/MEI)</span></label>
            <Input
              placeholder="00.000.000/0000-00"
              {...register('cnpj')}
              onChange={(e) => {
                const masked = maskCnpj(e.target.value);
                e.target.value = masked;
                setValue('cnpj', masked);
              }}
            />
            {errors.cnpj && <p className="text-xs text-destructive">{errors.cnpj.message}</p>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">Informe ao menos um dos documentos acima.</p>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar conta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Entre aqui
        </Link>
      </p>
    </div>
  );
}
