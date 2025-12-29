'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CrownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PremiumBadgeProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
}

export function PremiumBadge({
  className,
  variant = 'default',
  size = 'default',
}: PremiumBadgeProps) {
  const t = useTranslations('Common');

  const sizeClasses = {
    sm: 'text-xs h-5',
    default: 'text-xs h-6',
    lg: 'text-sm h-7',
  };

  const iconSizes = {
    sm: 'size-3',
    default: 'size-3',
    lg: 'size-4',
  };

  return (
    <Badge
      variant={variant}
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        'bg-orange-400 text-white border-0',
        sizeClasses[size],
        className
      )}
    >
      <CrownIcon className={iconSizes[size]} />
      {t('premium')}
    </Badge>
  );
}
