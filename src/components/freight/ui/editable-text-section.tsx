'use client';

import { FreightSection } from '@/components/freight/ui/freight-section';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

export function EditableTextSection({
  title,
  value,
  placeholder,
  onSave,
  labels,
  className,
  defaultEditing,
}: {
  title: ReactNode;
  value?: string | null;
  placeholder?: string;
  onSave: (nextValue: string) => Promise<void>;
  labels: {
    edit: string;
    cancel: string;
    save: string;
    saving: string;
  };
  className?: string;
  defaultEditing?: boolean;
}) {
  const [editing, setEditing] = useState(Boolean(defaultEditing));
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editing) return;
    setDraft(value ?? '');
  }, [editing, value]);

  const start = () => {
    setEditing(true);
    setDraft(value ?? '');
    setError('');
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value ?? '');
    setError('');
  };

  const save = async () => {
    try {
      setSaving(true);
      setError('');
      await onSave(draft);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FreightSection
      title={title}
      className={className}
      actions={
        editing ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cancel}
              disabled={saving}
            >
              {labels.cancel}
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={saving}>
              {saving ? labels.saving : labels.save}
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={start}>
            {labels.edit}
          </Button>
        )
      }
    >
      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            disabled={saving}
            placeholder={placeholder}
          />
          {error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : null}
        </div>
      ) : (
        <div
          className={cn(
            'min-h-[88px] whitespace-pre-wrap break-words text-sm text-muted-foreground'
          )}
        >
          {value?.trim() ? value : '-'}
        </div>
      )}
    </FreightSection>
  );
}
