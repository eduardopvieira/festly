import { useEffect, useRef, useState } from 'react';
import { Copy, Check, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { buscarPagamento } from '../services/pagamentoService';

const POLL_INTERVAL_MS = 3000;

function calcularRestante(expiresAt) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt) - new Date();
  return ms > 0 ? ms : 0;
}

function fmtCountdown(ms) {
  if (ms == null) return '';
  const totalSec = Math.floor(ms / 1000);
  const min = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const sec = String(totalSec % 60).padStart(2, '0');
  return `${min}:${sec}`;
}

export default function PixPagamento({ pagamento: inicial, onConfirmado }) {
  const [pagamento, setPagamento] = useState(inicial);
  const [copiado, setCopiado] = useState(false);
  const [restante, setRestante] = useState(() => calcularRestante(inicial.expiresAt));
  const pollRef = useRef(null);

  const status = pagamento.status;
  const finalizado = status !== 'AGUARDANDO';

  // Countdown de expiração
  useEffect(() => {
    if (!pagamento.expiresAt || finalizado) return;
    const t = setInterval(() => setRestante(calcularRestante(pagamento.expiresAt)), 1000);
    return () => clearInterval(t);
  }, [pagamento.expiresAt, finalizado]);

  // Polling enquanto AGUARDANDO
  useEffect(() => {
    if (finalizado) return undefined;
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await buscarPagamento(pagamento.id);
        setPagamento(data);
        if (data.status !== 'AGUARDANDO') {
          clearInterval(pollRef.current);
          if (data.status === 'CONFIRMADO') {
            toast.success('Pagamento confirmado!');
            onConfirmado?.(data);
          }
        }
      } catch {
        // mantém tentando no próximo tick
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [pagamento.id, finalizado, onConfirmado]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(pagamento.pix?.qrCode ?? '');
      setCopiado(true);
      toast.success('Código PIX copiado.');
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error('Não foi possível copiar.');
    }
  }

  if (status === 'CONFIRMADO') {
    return (
      <div className="text-center py-10">
        <CheckCircle2 className="h-14 w-14 mx-auto text-green-600 mb-3" />
        <p className="font-semibold text-lg">Pagamento confirmado!</p>
        <p className="text-sm text-muted-foreground mt-1">Seus agendamentos foram enviados aos prestadores.</p>
      </div>
    );
  }

  if (status === 'EXPIRADO' || status === 'FALHOU') {
    return (
      <div className="text-center py-10">
        <XCircle className="h-14 w-14 mx-auto text-muted-foreground mb-3" />
        <p className="font-semibold text-lg">{status === 'EXPIRADO' ? 'Pagamento expirado' : 'Pagamento falhou'}</p>
        <p className="text-sm text-muted-foreground mt-1">Os horários foram liberados. Você pode tentar novamente.</p>
      </div>
    );
  }

  const pix = pagamento.pix;
  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-sm text-muted-foreground mb-4">
        Escaneie o QR code com o app do seu banco ou copie o código.
      </p>

      {pix?.qrCode ? (
        <div className="rounded-lg border bg-white p-3">
          <QRCodeSVG value={pix.qrCode} size={208} level="M" />
        </div>
      ) : pix?.qrCodeImageBase64 ? (
        <img
          src={`data:image/png;base64,${pix.qrCodeImageBase64}`}
          alt="QR code PIX"
          className="h-56 w-56 rounded-lg border bg-white p-2"
        />
      ) : (
        <div className="h-56 w-56 rounded-lg border flex items-center justify-center text-muted-foreground text-sm">
          QR indisponível
        </div>
      )}

      {restante != null && (
        <p className="mt-3 text-sm flex items-center gap-1 text-muted-foreground">
          <Clock className="h-4 w-4" />
          Expira em <span className="font-semibold tabular-nums">{fmtCountdown(restante)}</span>
        </p>
      )}

      {pix?.qrCode && (
        <div className="mt-4 w-full max-w-sm">
          <div className="flex items-stretch gap-2">
            <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 text-xs text-left">
              {pix.qrCode}
            </code>
            <Button variant="outline" size="sm" onClick={copiar} aria-label="Copiar código PIX">
              {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        Aguardando confirmação do pagamento…
      </p>
    </div>
  );
}
