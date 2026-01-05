'use client';

import { Plus } from 'lucide-react';

export function FloatingActionButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-8 right-8 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label={label}
    >
      <Plus className="size-6" />
    </button>
  );
}
