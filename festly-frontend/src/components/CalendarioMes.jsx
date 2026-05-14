import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function CalendarioMes({ value, onChange, minDate, maxDate }) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [visMes, setVisMes] = useState(() => {
    const base = value ?? hoje;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const numDias = new Date(visMes.getFullYear(), visMes.getMonth() + 1, 0).getDate();
  const offset = visMes.getDay();

  const inicioPrimeiroDia = new Date(visMes.getFullYear(), visMes.getMonth(), 1);
  const fimUltimoDia = new Date(visMes.getFullYear(), visMes.getMonth(), numDias);

  const podeVoltar = !minDate || inicioPrimeiroDia > minDate ||
    new Date(visMes.getFullYear(), visMes.getMonth() - 1, 1) >= new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const podeAvancar = !maxDate || fimUltimoDia < maxDate;

  function mesAnterior() {
    setVisMes(new Date(visMes.getFullYear(), visMes.getMonth() - 1, 1));
  }

  function proximoMes() {
    setVisMes(new Date(visMes.getFullYear(), visMes.getMonth() + 1, 1));
  }

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= numDias; d++) cells.push(d);

  return (
    <div className="w-full select-none">
      <div className="flex items-center justify-between mb-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={mesAnterior}
          disabled={!podeVoltar}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold">
          {MESES[visMes.getMonth()]} {visMes.getFullYear()}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={proximoMes}
          disabled={!podeAvancar}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((dia, i) => {
          if (!dia) return <div key={`e-${i}`} />;

          const date = new Date(visMes.getFullYear(), visMes.getMonth(), dia);
          const isSelected = value && date.toDateString() === value.toDateString();
          const isHoje = date.toDateString() === hoje.toDateString();
          const disabled =
            (minDate && date < minDate) || (maxDate && date > maxDate);

          return (
            <button
              key={dia}
              type="button"
              onClick={() => !disabled && onChange(date)}
              disabled={disabled}
              className={[
                'flex items-center justify-center rounded-md text-sm py-1.5 transition-colors w-full',
                isSelected
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : isHoje
                  ? 'border border-primary text-primary font-medium hover:bg-primary/10'
                  : disabled
                  ? 'text-muted-foreground/35 cursor-not-allowed'
                  : 'hover:bg-accent cursor-pointer',
              ].join(' ')}
            >
              {dia}
            </button>
          );
        })}
      </div>
    </div>
  );
}
