import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '../contexts/AuthContext';
import { listarMeusServicos, deletarServico } from '../services/servicoService';
import { toast } from 'sonner';
import ServicoCard from '../components/ServicoCard';

export default function MeusServicos() {
  const { user } = useAuth();
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [servicoParaExcluir, setServicoParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    listarMeusServicos(user.id)
      .then(({ data }) => setServicos(data))
      .catch(() => toast.error('Erro ao carregar seus serviços.'))
      .finally(() => setLoading(false));
  }, [user.id]);

  async function confirmarExclusao() {
    setExcluindo(true);
    try {
      await deletarServico(servicoParaExcluir);
      setServicos((prev) => prev.filter((s) => s.id !== servicoParaExcluir));
      toast.success('Serviço excluído.');
    } catch {
      toast.error('Erro ao excluir serviço.');
    } finally {
      setExcluindo(false);
      setServicoParaExcluir(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Serviços</h1>
          <p className="mt-1 text-muted-foreground">
            {servicos.length} {servicos.length === 1 ? 'serviço cadastrado' : 'serviços cadastrados'}
          </p>
        </div>
        <Link to="/meus-servicos/novo">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo serviço
          </Button>
        </Link>
      </div>

      {servicos.length === 0 ? (
        <Card className="py-0">
          <CardContent className="flex flex-col items-center justify-center py-10 sm:py-20 text-center">
            <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-lg mb-1">Nenhum serviço cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Cadastre seu primeiro serviço para aparecer no catálogo e receber clientes.
            </p>
            <Link to="/meus-servicos/novo">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Cadastrar primeiro serviço
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {servicos.map((s) => (
            <ServicoCard
              key={s.id}
              servico={s}
              linkTo={`/meus-servicos/${s.id}/avaliacoes`}
              acoes={
                <>
                  <Link
                    to={`/meus-servicos/editar/${s.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer"
                  >
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 bg-white/90 hover:bg-white text-foreground cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7 bg-white/90 hover:bg-white text-destructive cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setServicoParaExcluir(s.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              }
            />
          ))}
        </div>
      )}

      <AlertDialog
        open={servicoParaExcluir !== null}
        onOpenChange={(open) => { if (!open) setServicoParaExcluir(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              disabled={excluindo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {excluindo ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
