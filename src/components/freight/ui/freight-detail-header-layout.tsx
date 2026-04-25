import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function FreightDetailHeaderLayout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-4',
        'lg:grid-cols-[320px_minmax(0,1fr)]',
        'xl:grid-cols-[320px_320px_320px_minmax(0,1fr)]',
        className
      )}
    >
      {children}
    </div>
  );
}
