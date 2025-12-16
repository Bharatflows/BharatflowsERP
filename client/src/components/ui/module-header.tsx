// Reusable Module Header with Back Button
import { ReactNode } from 'react';
import { BackButton } from './back-button';
import { cn } from '../../lib/utils';

interface ModuleHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  showBackButton?: boolean;
  backTo?: string;
  className?: string;
}

export function ModuleHeader({
  title,
  description,
  actions,
  showBackButton = true,
  backTo,
  className,
  icon,
}: ModuleHeaderProps & { icon?: ReactNode }) {
  return (
    <div className={cn('mb-6 space-y-4', className)}>
      {/* Back Button */}
      {showBackButton && (
        <BackButton to={backTo} />
      )}

      {/* Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="size-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center border border-primary/10 shadow-sm">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

