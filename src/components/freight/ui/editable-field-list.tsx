'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type EditableFieldKey = string;

export type EditableFieldRowConfig = {
  key: EditableFieldKey;
  label: ReactNode;
  getDisplayValue: () => ReactNode;
  getInitialDraftValue: () => unknown;
  renderEditor: (params: {
    draft: unknown;
    setDraft: (next: unknown) => void;
    disabled: boolean;
  }) => ReactNode;
  validateDraft?: (draft: unknown) => string | null;
  toPayload: (draft: unknown) => Record<string, unknown>;
};

function getRowKey(row: EditableFieldRowConfig) {
  return row.key;
}

export function EditableFieldList({
  rows,
  onSave,
  defaultEditingKey,
  editRequest,
  labels,
  className,
  labelClassName,
  valueClassName,
}: {
  rows: EditableFieldRowConfig[];
  onSave: (params: {
    key: EditableFieldKey;
    payload: Record<string, unknown>;
  }) => Promise<void>;
  defaultEditingKey?: EditableFieldKey;
  /**
   * Use this to programmatically start editing a specific row (e.g. after create).
   * Increment `nonce` to re-trigger even if the key is the same.
   */
  editRequest?: { key: EditableFieldKey; nonce: number } | null;
  labels?: {
    edit?: string;
    cancel?: string;
    save?: string;
    saving?: string;
  };
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}) {
  const rowsByKey = useMemo(
    () => new Map(rows.map((r) => [getRowKey(r), r])),
    [rows]
  );

  const [editingKey, setEditingKey] = useState<EditableFieldKey | null>(
    defaultEditingKey ?? null
  );
  const [draft, setDraft] = useState<unknown>(undefined);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const startEditing = useCallback(
    (key: EditableFieldKey) => {
      const row = rowsByKey.get(key);
      if (!row) return;
      setEditingKey(key);
      setDraft(row.getInitialDraftValue());
      setError('');
    },
    [rowsByKey]
  );

  const stopEditing = useCallback(() => {
    setEditingKey(null);
    setDraft(undefined);
    setError('');
  }, []);

  useEffect(() => {
    if (!editRequest) return;
    startEditing(editRequest.key);
  }, [editRequest, startEditing]);

  const safeLabels = useMemo(
    () => ({
      edit: labels?.edit ?? 'Edit',
      cancel: labels?.cancel ?? 'Cancel',
      save: labels?.save ?? 'Save',
      saving: labels?.saving ?? 'Saving...',
    }),
    [labels]
  );

  const doSave = async () => {
    if (!editingKey) return;
    const row = rowsByKey.get(editingKey);
    if (!row) return;

    const payload = row.toPayload(draft);
    if (Object.keys(payload).length === 0) {
      stopEditing();
      return;
    }

    const validate = row.validateDraft?.(draft);
    if (validate) {
      setError(validate);
      return;
    }

    try {
      setSaving(true);
      setError('');
      await onSave({ key: editingKey, payload });
      stopEditing();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn('divide-y rounded-md border', className)}>
      {rows.map((row) => {
        const isEditing = editingKey === row.key;
        return (
          <div
            key={row.key}
            className="grid grid-cols-[140px_1fr_auto] gap-3 p-3"
          >
            <div
              className={cn('text-sm text-muted-foreground', labelClassName)}
            >
              {row.label}
            </div>

            <div className={cn('min-w-0', valueClassName)}>
              {isEditing ? (
                <div className="space-y-2">
                  {row.renderEditor({
                    draft,
                    setDraft,
                    disabled: saving,
                  })}
                  {error ? (
                    <div className="text-sm text-destructive">{error}</div>
                  ) : null}
                </div>
              ) : (
                <div className="truncate text-sm">{row.getDisplayValue()}</div>
              )}
            </div>

            <div className="flex items-start gap-2 pt-0.5">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={stopEditing}
                    disabled={saving}
                  >
                    {safeLabels.cancel}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={doSave}
                    disabled={saving}
                  >
                    {saving ? safeLabels.saving : safeLabels.save}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => startEditing(row.key)}
                >
                  {safeLabels.edit}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
