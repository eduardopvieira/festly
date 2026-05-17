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
  { id: 'MONDAY', label: 'Segunda', curto: 'Seg' },
  { id: 'TUESDAY', label: 'Terça', curto: 'Ter' },
  { id: 'WEDNESDAY', label: 'Quarta', curto: 'Qua' },
  { id: 'THURSDAY', label: 'Quinta', curto: 'Qui' },
  { id: 'FRIDAY', label: 'Sexta', curto: 'Sex' },
  { id: 'SATURDAY', label: 'Sábado', curto: 'Sáb' },
  { id: 'SUNDAY', label: 'Domingo', curto: 'Dom' },
];

/** Granularidade salva nas regras (API de blocos derivados). Agenda contínua do cliente não depende deste valor. */
const DURACAO_BLOCO_PADRAO_MIN = 30;

function novaRegra() {
  return {
    diaInicio: 'MONDAY',
    diaFim: 'FRIDAY',
    ativa: true,
    intervalos: [{ horaInicio: '08:00', horaFim: '12:00' }],
  };
}

function rangeDias(inicio, fim) {
  const idxIni = DIAS.findIndex((d) => d.id === inicio);
  const idxFim = DIAS.findIndex((d) => d.id === fim);
  if (idxIni < 0 || idxFim < 0) return [];
  const labels = [];
  let i = idxIni;
  while (true) {
    labels.push(DIAS[i].curto);
    if (i === idxFim) break;
    i = (i + 1) % DIAS.length;
    if (labels.length > 7) break;
  }
  return labels;
}

function ehPernoite(horaInicio, horaFim) {
  return horaInicio && horaFim && horaInicio >= horaFim;
}

export default function DisponibilidadeSemanalEditor({ servicoId }) {
  const [regras, setRegras] = useState([novaRegra()]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    listarRegrasSemanais(servicoId)
      .then(({ data }) => {
        if (!data?.length) {
          setRegras([novaRegra()]);
          return;
        }
        setRegras(
          data.map((r) => ({
            diaInicio: r.diaInicio,
            diaFim: r.diaFim,
            ativa: r.ativa,
            intervalos: r.intervalos.map((it) => ({
              horaInicio: it.horaInicio.slice(0, 5),
              horaFim: it.horaFim.slice(0, 5),
            })),
          }))
        );
      })
      .catch(() => toast.error('Erro ao carregar disponibilidade.'))
      .finally(() => setCarregando(false));
  }, [servicoId]);

  function atualizarRegra(idx, patch) {
    setRegras((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function adicionarRegra() {
    setRegras((prev) => [...prev, novaRegra()]);
  }

  function removerRegra(idx) {
    setRegras((prev) => prev.filter((_, i) => i !== idx));
  }

  function adicionarIntervalo(idx) {
    setRegras((prev) =>
      prev.map((r, i) =>
        i === idx
          ? { ...r, intervalos: [...r.intervalos, { horaInicio: '14:00', horaFim: '18:00' }] }
          : r
      )
    );
  }

  function atualizarIntervalo(rIdx, iIdx, campo, valor) {
    setRegras((prev) =>
      prev.map((r, i) =>
        i === rIdx
          ? {
              ...r,
              intervalos: r.intervalos.map((it, j) =>
                j === iIdx ? { ...it, [campo]: valor } : it
              ),
            }
          : r
      )
    );
  }

  function removerIntervalo(rIdx, iIdx) {
    setRegras((prev) =>
      prev.map((r, i) =>
        i === rIdx
          ? { ...r, intervalos: r.intervalos.filter((_, j) => j !== iIdx) }
          : r
      )
    );
  }

  async function salvar() {
    if (!regras.length) {
      toast.error('Cadastre pelo menos uma regra.');
      return;
    }
    for (const r of regras) {
      if (!r.intervalos.length) {
        toast.error('Cada regra precisa ter pelo menos um intervalo.');
        return;
      }
      for (const it of r.intervalos) {
        if (!it.horaInicio || !it.horaFim) {
          toast.error('Preencha início e fim de todos os intervalos.');
          return;
        }
      }
    }

    const payload = regras.map((r) => ({
      diaInicio: r.diaInicio,
      diaFim: r.diaFim,
      duracaoPadraoMinutos: DURACAO_BLOCO_PADRAO_MIN,
      ativa: r.ativa,
      intervalos: r.intervalos.map((it) => ({
        horaInicio: `${it.horaInicio}:00`,
        horaFim: `${it.horaFim}:00`,
      })),
    }));

    setSalvando(true);
    try {
      await definirDisponibilidadeSemanal(servicoId, payload);
      toast.success('Disponibilidade atualizada!');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erro ao salvar disponibilidade.');
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Disponibilidade</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Defina blocos de dias contínuos (ex: <strong>sexta → domingo</strong>) com um ou
              mais intervalos de horário (ex: <strong>08:00–12:00</strong> e{' '}
              <strong>14:00–18:00</strong>). Quando o fim do horário for menor que o início,
              o intervalo é tratado como <strong>pernoite</strong>. O cliente escolhe horários
              livres de forma contínua; não é necessário configurar tamanho de &quot;slot&quot;.
            </p>
          </div>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-9 w-9 shrink-0"
            onClick={adicionarRegra}
            aria-label="Adicionar regra de disponibilidade"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {regras.map((regra, idx) => {
            const previewDias = rangeDias(regra.diaInicio, regra.diaFim).join(' · ');
            return (
              <div key={idx} className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={regra.ativa}
                      onChange={(e) => atualizarRegra(idx, { ativa: e.target.checked })}
                    />
                    Ativa
                  </label>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">De</span>
                    <select
                      value={regra.diaInicio}
                      onChange={(e) => atualizarRegra(idx, { diaInicio: e.target.value })}
                      className="h-9 rounded-md border border-input bg-background px-2"
                    >
                      {DIAS.map((d) => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </select>
                    <span className="text-muted-foreground">até</span>
                    <select
                      value={regra.diaFim}
                      onChange={(e) => atualizarRegra(idx, { diaFim: e.target.value })}
                      className="h-9 rounded-md border border-input bg-background px-2"
                    >
                      {DIAS.map((d) => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => adicionarIntervalo(idx)}
                    >
                      <Plus className="h-3.5 w-3.5" /> Intervalo
                    </Button>
                    {regras.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive"
                        onClick={() => removerRegra(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {previewDias && (
                  <p className="text-xs text-muted-foreground">Dias: {previewDias}</p>
                )}

                <div className="space-y-2">
                  {regra.intervalos.map((it, iIdx) => {
                    const pernoite = ehPernoite(it.horaInicio, it.horaFim);
                    return (
                      <div key={iIdx} className="flex flex-wrap items-center gap-2">
                        <input
                          type="time"
                          value={it.horaInicio}
                          onChange={(e) => atualizarIntervalo(idx, iIdx, 'horaInicio', e.target.value)}
                          className="h-9 w-28 rounded-md border border-input bg-background px-2 text-sm"
                        />
                        <span className="text-sm text-muted-foreground">até</span>
                        <input
                          type="time"
                          value={it.horaFim}
                          onChange={(e) => atualizarIntervalo(idx, iIdx, 'horaFim', e.target.value)}
                          className="h-9 w-28 rounded-md border border-input bg-background px-2 text-sm"
                        />
                        {pernoite && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200">
                            pernoite (dia seguinte)
                          </span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive"
                          onClick={() => removerIntervalo(idx, iIdx)}
                          disabled={regra.intervalos.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
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
