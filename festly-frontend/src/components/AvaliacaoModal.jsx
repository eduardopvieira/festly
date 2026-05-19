import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import StarRating from './StarRating';
import { criarAvaliacao } from '../services/avaliacaoService';

const MAX_COMENTARIO = 500;

export default function AvaliacaoModal({
  open,
  onOpenChange,
  agendamentoId,
  nomeServico,
  onEnviada,
}) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open) {
      setNota(0);
      setComentario('');
      setEnviando(false);
    }
  }, [open]);

  async function handleEnviar() {
    if (nota < 1) {
      toast.error('Escolha uma nota de 1 a 5 estrelas.');
      return;
    }
    setEnviando(true);
    try {
      await criarAvaliacao({
        agendamentoId,
        nota,
        comentario: comentario.trim() || null,
      });
      toast.success('Avaliação enviada.');
      onEnviada?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.erro ?? 'Erro ao enviar avaliação.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Avaliar serviço</DialogTitle>
          <DialogDescription>
            Como foi sua experiência com <strong>{nomeServico}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex justify-center">
            <StarRating value={nota} onChange={setNota} size="lg" />
          </div>

          <div>
            <Textarea
              placeholder="Conte como foi sua experiência (opcional)"
              value={comentario}
              onChange={(e) => {
                if (e.target.value.length <= MAX_COMENTARIO) setComentario(e.target.value);
              }}
              maxLength={MAX_COMENTARIO}
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {comentario.length}/{MAX_COMENTARIO}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={enviando}>
            Pular
          </Button>
          <Button onClick={handleEnviar} disabled={enviando || nota < 1}>
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar avaliação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
