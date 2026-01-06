import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function FreightSection({
  title,
  icon: Icon,
  actions,
  className,
  headerClassName,
  contentClassName,
  children,
}: {
  title: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('overflow-hidden rounded-lg border bg-card', className)}>
      <div
        className={cn(
          'flex items-center justify-between gap-3 border-b bg-muted px-4 py-2.5',
          headerClassName
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? (
            <Icon className="size-4 shrink-0 text-muted-foreground" />
          ) : null}
          <div className="truncate text-sm font-semibold">{title}</div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className={cn('p-4', contentClassName)}>{children}</div>
    </div>
  );
}
