import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, QrCode, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useCart } from '../contexts/CartContext';
import { criarCheckout } from '../services/pagamentoService';
import PixPagamento from '../components/PixPagamento';

const cartaoSchema = z.object({
  numero: z.string().min(13, 'Número inválido'),
  titular: z.string().min(1, 'Obrigatório'),
  validadeMes: z.string().regex(/^(0?[1-9]|1[0-2])$/, 'Mês inválido'),
  validadeAno: z.string().regex(/^\d{4}$/, 'Ano com 4 dígitos'),
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV inválido'),
  cpfTitular: z.string().min(11, 'CPF inválido'),
  cep: z.string().min(8, 'CEP inválido'),
  numeroEndereco: z.string().min(1, 'Obrigatório'),
});

function fmtMoeda(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, fetchCart } = useCart();
  const [metodo, setMetodo] = useState('PIX');
  const [pagamentoPix, setPagamentoPix] = useState(null);
  const [processando, setProcessando] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(cartaoSchema),
  });

  async function enviar(metodoEscolhido, cartao) {
    setProcessando(true);
    try {
      const { data } = await criarCheckout({ metodo: metodoEscolhido, cartao: cartao ?? null });
      await fetchCart(); // o backend limpou o carrinho
      if (data.status === 'CONFIRMADO') {
        toast.success('Pagamento confirmado! Agendamentos enviados.');
        navigate('/meus-agendamentos');
      } else {
        setPagamentoPix(data); // PIX aguardando → QR na mesma página
      }
    } catch (err) {
      const msg = err.response?.data?.erro ?? err.response?.data?.message ?? 'Erro ao processar pagamento.';
      toast.error(msg, { duration: 6000 });
    } finally {
      setProcessando(false);
    }
  }

  // PIX criado → mostra QR
  if (pagamentoPix) {
    return (
      <div className="mx-auto max-w-md px-4 sm:px-6 py-8">
        <h1 className="text-xl font-bold mb-6">Pagamento via PIX</h1>
        <Card>
          <CardContent className="p-6">
            <PixPagamento
              pagamento={pagamentoPix}
              onConfirmado={() => setTimeout(() => navigate('/meus-agendamentos'), 1500)}
            />
          </CardContent>
        </Card>
        <Button variant="ghost" className="mt-4 w-full" onClick={() => navigate('/meus-pagamentos')}>
          Ver meus pagamentos
        </Button>
      </div>
    );
  }

  // Carrinho vazio (e ainda não gerou PIX)
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-muted-foreground">
        <p className="font-medium">Seu carrinho está vazio.</p>
        <Button className="mt-4" onClick={() => navigate('/dashboard/carrinho')}>Voltar ao carrinho</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-8">
      <button
        onClick={() => navigate('/dashboard/carrinho')}
        className="text-sm text-muted-foreground flex items-center gap-1 mb-4 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao carrinho
      </button>
      <h1 className="text-xl font-bold mb-6">Pagamento</h1>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <span className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? 'serviço' : 'serviços'}
            </span>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{fmtMoeda(total)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMetodo('PIX')}
              className={[
                'flex flex-col items-center gap-1 rounded-lg border p-4 text-sm font-medium transition-colors',
                metodo === 'PIX' ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-foreground/30',
              ].join(' ')}
            >
              <QrCode className="h-5 w-5" /> PIX
            </button>
            <button
              type="button"
              onClick={() => setMetodo('CARTAO_CREDITO')}
              className={[
                'flex flex-col items-center gap-1 rounded-lg border p-4 text-sm font-medium transition-colors',
                metodo === 'CARTAO_CREDITO' ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-foreground/30',
              ].join(' ')}
            >
              <CreditCard className="h-5 w-5" /> Cartão de crédito
            </button>
          </div>

          {metodo === 'PIX' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Geramos um QR code para você pagar no app do seu banco. Você tem 30 minutos para concluir.
              </p>
              <Button className="w-full" size="lg" disabled={processando} onClick={() => enviar('PIX', null)}>
                {processando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gerar PIX
              </Button>
            </div>
          )}

          {metodo === 'CARTAO_CREDITO' && (
            <form onSubmit={handleSubmit((v) => enviar('CARTAO_CREDITO', v))} className="space-y-3">
              <Field label="Número do cartão" error={errors.numero}>
                <Input inputMode="numeric" placeholder="4111 1111 1111 1111" {...register('numero')} />
              </Field>
              <Field label="Nome do titular" error={errors.titular}>
                <Input placeholder="Como impresso no cartão" {...register('titular')} />
              </Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Mês" error={errors.validadeMes}>
                  <Input inputMode="numeric" placeholder="12" {...register('validadeMes')} />
                </Field>
                <Field label="Ano" error={errors.validadeAno}>
                  <Input inputMode="numeric" placeholder="2030" {...register('validadeAno')} />
                </Field>
                <Field label="CVV" error={errors.cvv}>
                  <Input inputMode="numeric" placeholder="123" {...register('cvv')} />
                </Field>
              </div>
              <Field label="CPF do titular" error={errors.cpfTitular}>
                <Input inputMode="numeric" placeholder="000.000.000-00" {...register('cpfTitular')} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="CEP" error={errors.cep}>
                  <Input inputMode="numeric" placeholder="00000-000" {...register('cep')} />
                </Field>
                <Field label="Número" error={errors.numeroEndereco}>
                  <Input inputMode="numeric" placeholder="123" {...register('numeroEndereco')} />
                </Field>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={processando}>
                {processando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Pagar {fmtMoeda(total)}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Seus dados de cartão não são armazenados pelo Festly.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
