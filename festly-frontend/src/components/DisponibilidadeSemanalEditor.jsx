import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  definirDisponibilidadeSemanal,
  listarRegrasSemanais,
} from '../services/agendamentoService';

const DIAS = [
  { id: 'MONDAY', label: 'Segunda' },
  { id: 'TUESDAY', label: 'Terça' },
  { id: 'WEDNESDAY', label: 'Quarta' },
  { id: 'THURSDAY', label: 'Quinta' },
  { id: 'FRIDAY', label: 'Sexta' },
  { id: 'SATURDAY', label: 'Sábado' },
  { id: 'SUNDAY', label: 'Domingo' },
];

const DURACOES = [30, 45, 60, 90, 120];

function intervaloVazio() {
  return { horaInicio: '08:00', horaFim: '12:00', duracaoMinutos: 60 };
}

export default function DisponibilidadeSemanalEditor({ servicoId }) {
  const [estado, setEstado] = useState(
    DIAS.reduce((acc, dia) => ({ ...acc, [dia.id]: { ativo: false, intervalos: [] } }), {})
  );
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    listarRegrasSemanais(servicoId)
      .then(({ data }) => {
        const novo = DIAS.reduce(
          (acc, dia) => ({ ...acc, [dia.id]: { ativo: false, intervalos: [] } }),
          {}
        );
        data.forEach((regra) => {
          const dia = novo[regra.diaSemana];
          if (!dia) return;
          dia.ativo = true;
          dia.intervalos.push({
            horaInicio: regra.horaInicio.slice(0, 5),
            horaFim: regra.horaFim.slice(0, 5),
            duracaoMinutos: regra.duracaoMinutos,
          });
        });
        setEstado(novo);
      })
      .catch(() => toast.error('Erro ao carregar disponibilidade.'))
      .finally(() => setCarregando(false));
  }, [servicoId]);

  function alternarDia(diaId) {
    setEstado((prev) => {
      const dia = prev[diaId];
      const ativo = !dia.ativo;
      return {
        ...prev,
        [diaId]: {
          ativo,
          intervalos: ativo && dia.intervalos.length === 0 ? [intervaloVazio()] : dia.intervalos,
        },
      };
    });
  }

  function atualizarIntervalo(diaId, idx, campo, valor) {
    setEstado((prev) => ({
      ...prev,
      [diaId]: {
        ...prev[diaId],
        intervalos: prev[diaId].intervalos.map((it, i) =>
          i === idx ? { ...it, [campo]: campo === 'duracaoMinutos' ? Number(valor) : valor } : it
        ),
      },
    }));
  }

  function adicionarIntervalo(diaId) {
    setEstado((prev) => ({
      ...prev,
      [diaId]: {
        ...prev[diaId],
        intervalos: [...prev[diaId].intervalos, intervaloVazio()],
      },
    }));
  }

  function removerIntervalo(diaId, idx) {
    setEstado((prev) => ({
      ...prev,
      [diaId]: {
        ...prev[diaId],
        intervalos: prev[diaId].intervalos.filter((_, i) => i !== idx),
      },
    }));
  }

  async function salvar() {
    const regras = [];
    for (const dia of DIAS) {
      const cfg = estado[dia.id];
      if (!cfg.ativo) continue;
      for (const intervalo of cfg.intervalos) {
        if (intervalo.horaInicio >= intervalo.horaFim) {
          toast.error(`Em ${dia.label}: a hora de início deve ser menor que a hora de fim.`);
          return;
        }
        regras.push({
          diaSemana: dia.id,
          horaInicio: `${intervalo.horaInicio}:00`,
          horaFim: `${intervalo.horaFim}:00`,
          duracaoMinutos: intervalo.duracaoMinutos,
        });
      }
    }

    if (regras.length === 0) {
      toast.error('Cadastre pelo menos um intervalo.');
      return;
    }

    setSalvando(true);
    try {
      await definirDisponibilidadeSemanal(servicoId, regras);
      toast.success('Disponibilidade semanal atualizada!');
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erro ao salvar disponibilidade.';
      toast.error(msg);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <Card className="py-0">
        <CardContent className="p-6">
          <div className="h-32 animate-pulse rounded-md bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="py-0">
      <CardContent className="p-6">
        <h2 className="font-semibold">Disponibilidade semanal</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Defina os dias e intervalos em que esse serviço aceita reservas. Os blocos clicáveis para o cliente são
          gerados automaticamente.
        </p>

        <div className="mt-4 space-y-3">
          {DIAS.map((dia) => {
            const cfg = estado[dia.id];
            return (
              <div key={dia.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={cfg.ativo}
                      onChange={() => alternarDia(dia.id)}
                    />
                    {dia.label}
                  </label>
                  {cfg.ativo && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => adicionarIntervalo(dia.id)}
                    >
                      <Plus className="h-3.5 w-3.5" /> Intervalo
                    </Button>
                  )}
                </div>

                {cfg.ativo && (
                  <div className="mt-3 space-y-2">
                    {cfg.intervalos.map((intervalo, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-2">
                        <input
                          type="time"
                          value={intervalo.horaInicio}
                          onChange={(e) => atualizarIntervalo(dia.id, idx, 'horaInicio', e.target.value)}
                          className="h-9 w-28 rounded-md border border-input bg-background px-2 text-sm"
                        />
                        <span className="text-sm text-muted-foreground">até</span>
                        <input
                          type="time"
                          value={intervalo.horaFim}
                          onChange={(e) => atualizarIntervalo(dia.id, idx, 'horaFim', e.target.value)}
                          className="h-9 w-28 rounded-md border border-input bg-background px-2 text-sm"
                        />
                        <select
                          value={intervalo.duracaoMinutos}
                          onChange={(e) => atualizarIntervalo(dia.id, idx, 'duracaoMinutos', e.target.value)}
                          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        >
                          {DURACOES.map((d) => (
                            <option key={d} value={d}>{d} min</option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive"
                          onClick={() => removerIntervalo(dia.id, idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Button className="mt-6" onClick={salvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar disponibilidade'}
        </Button>
      </CardContent>
    </Card>
  );
}
