import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

export const LOGO_SRC = '/images/logo/logo.png';

const sizeClasses = {
  sm: 'w-8 h-8 min-w-[2rem] min-h-[2rem]',
  md: 'w-10 h-10 min-w-[2.5rem] min-h-[2.5rem]',
  lg: 'w-12 h-12 min-w-[3rem] min-h-[3rem]',
  xl: 'w-14 h-14 min-w-[3.5rem] min-h-[3.5rem]',
  '2xl': 'w-16 h-16 min-w-[4rem] min-h-[4rem]',
};

/**
 * Logo officiel dans un cercle à fond blanc (lisible sur fond clair ou foncé).
 */
export function BrandLogoMark({ size = 'md', className, paddingClassName = 'p-1.5' }) {
  return (
    <div
      className={clsx(
        'rounded-full bg-white flex items-center justify-center shadow-sm ring-1 ring-black/5 overflow-hidden shrink-0',
        paddingClassName,
        sizeClasses[size] || sizeClasses.md,
        className
      )}
    >
      <img
        src={LOGO_SRC}
        alt="Thé Tip Top"
        className="w-full h-full object-contain select-none pointer-events-none"
        width={64}
        height={64}
        decoding="async"
      />
    </div>
  );
}

/**
 * Lien d’accueil avec logo ; optionnellement le nom de marque à côté.
 */
export default function BrandLogo({
  size = 'md',
  showText = false,
  textClassName = '',
  className = '',
  to = '/',
}) {
  return (
    <Link to={to} className={clsx('flex items-center gap-2 group', className)}>
      <BrandLogoMark size={size} />
      {showText && (
        <span className={clsx('font-display text-xl font-bold', textClassName)}>Thé Tip Top</span>
      )}
    </Link>
  );
}
