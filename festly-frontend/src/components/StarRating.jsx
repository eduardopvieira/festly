import { Star } from 'lucide-react';

export default function StarRating({ value = 0, onChange, size = 'md' }) {
  const interactive = typeof onChange === 'function';
  const sizeClass = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }[size] ?? 'h-6 w-6';

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange(n)}
            className={[
              interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default',
              'p-0 bg-transparent border-0',
            ].join(' ')}
            aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
          >
            <Star
              className={[sizeClass, filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'].join(' ')}
            />
          </button>
        );
      })}
    </div>
  );
}
