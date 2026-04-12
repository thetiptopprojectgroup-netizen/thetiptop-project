import { Star } from 'lucide-react';
import { clsx } from 'clsx';

export default function StarRatingInput({ value, onChange, disabled, id = 'review-rating' }) {
  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label="Note sur 5 étoiles"
      id={id}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className={clsx(
            'rounded p-0.5 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400',
            disabled && 'opacity-50 pointer-events-none'
          )}
          aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
          aria-pressed={value >= n}
        >
          <Star
            className={clsx(
              'h-8 w-8 sm:h-9 sm:w-9',
              n <= value ? 'fill-gold-400 text-gold-500' : 'fill-cream-200 text-cream-300'
            )}
            strokeWidth={1.2}
          />
        </button>
      ))}
    </div>
  );
}
