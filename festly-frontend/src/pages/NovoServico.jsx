import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { criarServico } from '../services/servicoService';
import { toast } from 'sonner';
import ServicoForm from '../components/ServicoForm';

export default function NovoServico() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.tipoUsuario !== 'PRESTADOR') {
      toast.error('Acesso restrito a prestadores.');
      navigate('/');
    }
  }, [user, navigate]);

  async function onSubmit(values) {
    setIsSubmitting(true);
    try {
      const { data } = await criarServico({ ...values, usuarioId: user.id });
      toast.success('Serviço criado! Adicione fotos agora se quiser.');
      navigate(`/meus-servicos/editar/${data.id}`);
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erro ao cadastrar serviço.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/meus-servicos">
          <Button variant="ghost" size="sm" className="gap-2 mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Meus serviços
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Novo serviço</h1>
        <p className="mt-1 text-muted-foreground">Preencha os dados do serviço que você oferece.</p>
      </div>
      <Card className="py-0">
        <CardContent className="p-6">
          <ServicoForm
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            titulo="Cadastrar serviço"
          />
        </CardContent>
      </Card>
    </div>
  );
}
