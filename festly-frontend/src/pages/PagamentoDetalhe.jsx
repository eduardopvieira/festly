import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { buscarPagamento } from '../services/pagamentoService';
import PixPagamento from '../components/PixPagamento';

const STATUS_LABEL = {
  AGUARDANDO: 'Aguardando pagamento',
  CONFIRMADO: 'Confirmado',
  EXPIRADO: 'Expirado',
  FALHOU: 'Falhou',
  ESTORNADO_PARCIAL: 'Estornado parcial',
  ESTORNADO_TOTAL: 'Estornado',
};

function fmtMoeda(v) { return `R$ ${Number(v).toFixed(2).replace('.', ',')}`; }

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function PagamentoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pagamento, setPagamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data } = await buscarPagamento(id);
        if (ativo) setPagamento(data);
      } catch {
        if (ativo) setErro(true);
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => { ativo = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (erro || !pagamento) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-muted-foreground">
        <p className="font-medium">Pagamento não encontrado.</p>
        <Button className="mt-4" onClick={() => navigate('/meus-pagamentos')}>Ver meus pagamentos</Button>
      </div>
    );
  }

  const isPixAguardando = pagamento.metodo === 'PIX' && pagamento.status === 'AGUARDANDO';

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-8">
      <button
        onClick={() => navigate('/meus-pagamentos')}
        className="text-sm text-muted-foreground flex items-center gap-1 mb-4 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Meus pagamentos
      </button>
      <h1 className="text-xl font-bold mb-6">Pagamento #{pagamento.id}</h1>
      <Card>
        <CardContent className="p-6">
          {isPixAguardando ? (
            <PixPagamento
              pagamento={pagamento}
              onConfirmado={() => setTimeout(() => navigate('/meus-agendamentos'), 1500)}
            />
          ) : (
            <div className="space-y-3">
              <Row label="Status" value={STATUS_LABEL[pagamento.status] ?? pagamento.status} />
              <Row label="Método" value={pagamento.metodo === 'PIX' ? 'PIX' : 'Cartão de crédito'} />
              <Row label="Total" value={fmtMoeda(pagamento.valorTotal)} />
              <Row label="Itens" value={String(pagamento.itens?.length ?? 0)} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
