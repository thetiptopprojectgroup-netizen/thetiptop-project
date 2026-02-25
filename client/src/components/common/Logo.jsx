import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

export default function Logo({
  size = 'md',
  showText = true,
  variant = 'default',
  linkTo = '/',
  className,
  textClassName,
}) {
  const sizes = {
    sm: { container: 'w-8 h-8', image: 'w-6 h-6', text: 'text-lg' },
    md: { container: 'w-10 h-10', image: 'w-7 h-7', text: 'text-xl' },
    lg: { container: 'w-14 h-14', image: 'w-10 h-10', text: 'text-2xl' },
    xl: { container: 'w-20 h-20', image: 'w-14 h-14', text: 'text-3xl' },
  };

  const currentSize = sizes[size];

  const logoContent = (
    <div className={clsx('flex items-center gap-2 group', className)}>
      <div className="relative">
        <div
          className={clsx(
            currentSize.container,
            'rounded-full flex items-center justify-center transition-all duration-300',
            'bg-white shadow-md group-hover:shadow-lg',
            variant === 'onDark' && 'ring-2 ring-white/20'
          )}
        >
          <img
            src="/images/logo/logo.png"
            alt="Thé Tip Top Logo"
            className={clsx(currentSize.image, 'object-contain')}
          />
        </div>
        {variant !== 'simple' && (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-1 h-2 bg-matcha-400/60 rounded-full animate-steam" />
          </div>
        )}
      </div>
      {showText && (
        <span
          className={clsx(
            'font-display font-bold transition-colors',
            currentSize.text,
            variant === 'onDark' ? 'text-white' : 'text-tea-900',
            textClassName
          )}
        >
          Thé Tip Top
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{logoContent}</Link>;
  }

  return logoContent;
}
