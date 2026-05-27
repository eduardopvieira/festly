import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { criarServico, atualizarServico, uploadFoto } from '../services/servicoService';
import { listarRegrasSemanais } from '../services/agendamentoService';
import { toast } from 'sonner';
import ServicoForm from '../components/ServicoForm';
import DisponibilidadeSemanalEditor from '../components/DisponibilidadeSemanalEditor';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

const STEPS = [
  { label: 'Dados' },
  { label: 'Disponibilidade' },
  { label: 'Fotos' },
];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className={[
              'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
              done ? 'bg-primary text-primary-foreground' : active ? 'border-2 border-primary text-primary' : 'border-2 border-muted text-muted-foreground',
            ].join(' ')}>
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`text-sm ${active ? 'font-semibold' : 'text-muted-foreground'}`}>{step.label}</span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-muted-foreground/30 mx-1" />}
          </div>
        );
      })}
    </div>
  );
}

export default function ServicoWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [servicoId, setServicoId] = useState(null);
  const [formValues, setFormValues] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fotos, setFotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  // Passo 1 — criar serviço com disponivel=false
  async function handleDados(values) {
    setIsSubmitting(true);
    try {
      const { data } = await criarServico({ ...values, usuarioId: user.id, disponivel: false });
      setServicoId(data.id);
      setFormValues(values);
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erro ao salvar serviço.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Passo 2 — verificar se há ao menos uma regra ativa antes de avançar
  async function handleDisponibilidade() {
    try {
      const { data: regras } = await listarRegrasSemanais(servicoId);
      const temAtiva = regras.some((r) => r.ativa && r.intervalos?.length > 0);
      if (!temAtiva) {
        toast.error('Configure ao menos um horário de atendimento para continuar.');
        return;
      }
      setStep(2);
    } catch {
      toast.error('Erro ao verificar disponibilidade.');
    }
  }

  // Passo 3 — upload de foto
  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await uploadFoto(servicoId, file);
      setFotos((prev) => [...prev, data]);
    } catch {
      toast.error('Erro ao fazer upload da foto.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  // Passo 3 — concluir: ativa o serviço enviando os dados completos
  async function handleConcluir() {
    setIsSubmitting(true);
    try {
      await atualizarServico(servicoId, { ...formValues, usuarioId: user.id, disponivel: true });
      toast.success('Serviço criado e publicado com sucesso!');
      navigate('/meus-servicos');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erro ao publicar serviço.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 mb-4 -ml-2"
          onClick={() => (step === 0 ? navigate('/meus-servicos') : setStep(step - 1))}
        >
          <ArrowLeft className="h-4 w-4" />
          {step === 0 ? 'Meus serviços' : 'Voltar'}
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Novo serviço</h1>
        <p className="mt-1 text-muted-foreground">Configure seu serviço em 3 etapas.</p>
      </div>

      <StepIndicator current={step} />

      {/* Passo 1 — Dados */}
      {step === 0 && (
        <Card className="py-0">
          <CardContent className="p-6">
            <ServicoForm
              onSubmit={handleDados}
              isSubmitting={isSubmitting}
              titulo="Salvar e continuar"
              hideDisponivel
            />
          </CardContent>
        </Card>
      )}

      {/* Passo 2 — Disponibilidade */}
      {step === 1 && servicoId && (
        <div className="space-y-4">
          <DisponibilidadeSemanalEditor servicoId={servicoId} />
          <div className="flex justify-end">
            <Button onClick={handleDisponibilidade} className="gap-2">
              Continuar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Passo 3 — Fotos */}
      {step === 2 && servicoId && (
        <div className="space-y-4">
          <Card className="py-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold">Fotos do serviço</h2>
                  <p className="text-xs text-muted-foreground">{fotos.length}/5 fotos (opcional)</p>
                </div>
                {fotos.length < 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar foto
                  </Button>
                )}
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>

              {fotos.length === 0 && !uploading ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma foto adicionada. Você pode pular esta etapa.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {fotos.map((foto) => (
                    <div key={foto.id} className="relative group">
                      <img
                        src={`${API_BASE}${foto.url}`}
                        alt=""
                        className="w-full h-24 object-cover rounded-md"
                      />
                    </div>
                  ))}
                  {uploading && <div className="w-full h-24 rounded-md bg-muted animate-pulse" />}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleConcluir} disabled={isSubmitting} className="gap-2">
              <Check className="h-4 w-4" />
              {fotos.length > 0 ? 'Publicar serviço' : 'Publicar sem fotos'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
