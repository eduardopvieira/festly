import { useState } from 'react';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '../contexts/AuthContext';
import { criarAgendamento } from '../services/agendamentoService';
import { toast } from 'sonner';
import CalendarioBlocos from './CalendarioBlocos';

const CATEGORIA_LABEL = {
  BUFFET: 'Buffet', DJ: 'DJ', DECORACAO: 'Decoração',
  FOTOGRAFIA: 'Fotografia', ILUMINACAO: 'Iluminação', SOM: 'Som',
  SEGURANCA: 'Segurança', ANIMACAO: 'Animação', OUTROS: 'Outros',
};

const COBRANCA_SUFFIX = {
  POR_EVENTO: '/evento', POR_PESSOA: '/pessoa', POR_HORA: '/hora',
};

export default function CatalogoCard({ servico }) {
  const initial = servico.nome?.charAt(0).toUpperCase() ?? '?';
  const { user } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [blocoSelecionado, setBlocoSelecionado] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [agendando, setAgendando] = useState(false);

  function abrirModal() {
    setBlocoSelecionado(null);
    setIsModalOpen(true);
  }

  async function handleConfirm() {
    if (!blocoSelecionado || !user?.id || agendando) return;
    setAgendando(true);
    try {
      await criarAgendamento({
        servicoId: servico.id,
        clienteId: user.id,
        dataEvento: blocoSelecionado.data,
        horarioEvento: blocoSelecionado.hora,
      });
      toast.success('Agendamento realizado com sucesso!');
      setIsModalOpen(false);
      setBlocoSelecionado(null);
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erro ao realizar agendamento.';
      toast.error(msg);
      setBlocoSelecionado(null);
      setRefreshKey((prev) => prev + 1);
    } finally {
      setAgendando(false);
    }
  }

  return (
    <>
      <Card className="transition-all hover:shadow-md py-0">
        <CardContent className="p-4 flex gap-4">
          <div className="h-14 w-14 shrink-0 rounded-xl flex items-center justify-center bg-primary text-primary-foreground text-2xl font-bold">
            {initial}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div>
                <p className="font-semibold text-sm leading-tight">{servico.nome}</p>
                <p className="text-xs text-primary mt-0.5">
                  {CATEGORIA_LABEL[servico.categoria] ?? servico.categoria} · {servico.cidade}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-sm">R$ {Number(servico.preco).toFixed(2).replace('.', ',')}</p>
                <p className="text-xs text-muted-foreground">{COBRANCA_SUFFIX[servico.tipoCobranca]}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-4">
              <span className="text-xs text-amber-500">★ <span className="text-muted-foreground">—</span></span>

              {user?.tipoUsuario === 'CLIENTE' && (
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs gap-1.5"
                  onClick={abrirModal}
                >
                  <CalendarIcon className="h-3 w-3" />
                  Agendar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Agendar {servico.nome}</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione um horário disponível na agenda do prestador.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <CalendarioBlocos
              servicoId={servico.id}
              blocoSelecionado={blocoSelecionado}
              onSelecionarBloco={setBlocoSelecionado}
              refreshKey={refreshKey}
            />
          </div>

          {blocoSelecionado && (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              Horário escolhido:{' '}
              <strong>
                {new Date(`${blocoSelecionado.data}T00:00:00`).toLocaleDateString('pt-BR')} ·{' '}
                {blocoSelecionado.hora.slice(0, 5)}
              </strong>{' '}
              ({blocoSelecionado.duracaoMinutos} min)
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button onClick={handleConfirm} disabled={!blocoSelecionado || agendando}>
              {agendando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar Agendamento
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
