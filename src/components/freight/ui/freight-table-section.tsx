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
}: {
  title: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
  headerClassName?: string;
  tableWrapperClassName?: string;
  children: ReactNode;
}) {
  return (
    <FreightSection
      title={title}
      icon={icon}
      actions={actions}
      className={className}
      headerClassName={headerClassName}
      contentClassName="p-0"
    >
      <div className={cn('w-full overflow-auto', tableWrapperClassName)}>
        {children}
      </div>
    </FreightSection>
  );
}
