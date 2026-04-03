import { clsx } from 'clsx';

export default function Card({
  children,
  className,
  elevated = false,
  hover = false,
  padding = 'md',
  ...props
}) {
  const paddingSizes = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(
        elevated ? 'card-elevated' : 'card',
        paddingSizes[padding],
        hover && 'transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Card Header
Card.Header = function CardHeader({ children, className, ...props }) {
  return (
    <div
      className={clsx(
        'border-b border-cream-200 pb-4 mb-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Title
Card.Title = function CardTitle({ children, className, ...props }) {
  return (
    <h3
      className={clsx('text-xl font-display font-semibold text-tea-900', className)}
      {...props}
    >
      {children}
    </h3>
  );
};

// Card Description
Card.Description = function CardDescription({ children, className, ...props }) {
  return (
    <p className={clsx('text-tea-600 mt-1', className)} {...props}>
      {children}
    </p>
  );
};

// Card Body
Card.Body = function CardBody({ children, className, ...props }) {
  return (
    <div className={clsx('', className)} {...props}>
      {children}
    </div>
  );
};

// Card Footer
Card.Footer = function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={clsx(
        'border-t border-cream-200 pt-4 mt-4 flex items-center justify-end gap-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
