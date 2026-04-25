import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { FreightSection } from './freight-section';

export function FreightTableSection({
  title,
  icon,
  actions,
  className,
  headerClassName,
  tableWrapperClassName,
  children,
  footer,
}: {
  title: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
  headerClassName?: string;
  tableWrapperClassName?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <FreightSection
      title={title}
      icon={icon}
      actions={actions}
      className={cn('flex flex-col', className)}
      headerClassName={headerClassName}
      contentClassName="flex flex-col flex-1 p-0 min-h-0"
    >
      <div className={cn('w-full flex-1 overflow-auto', tableWrapperClassName)}>
        {children}
      </div>
      {footer ? footer : null}
    </FreightSection>
  );
}
