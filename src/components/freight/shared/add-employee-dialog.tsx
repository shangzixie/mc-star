'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateFreightEmployee } from '@/hooks/freight/use-freight-master-data';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import type { FreightEmployee } from '@/lib/freight/api-types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const createEmployeeSchema = z.object({
  fullName: z.string().trim().min(1),
  branch: z.string().trim().min(1),
  department: z.string().trim().min(1),
});

type FormValues = z.infer<typeof createEmployeeSchema>;

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (employee: FreightEmployee) => void;
}

export function AddEmployeeDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddEmployeeDialogProps) {
  const t = useTranslations('Dashboard.freight.inbound');
  const tCommon = useTranslations('Common');
  const createMutation = useCreateFreightEmployee();

  const form = useForm<FormValues>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      fullName: '',
      branch: '',
      department: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        fullName: '',
        branch: '',
        department: '',
      });
    }
  }, [open, form]);

  const handleSubmit = async (data: FormValues) => {
    try {
      const result = await createMutation.mutateAsync({
        fullName: data.fullName.trim(),
        branch: data.branch.trim(),
        department: data.department.trim(),
      });
      toast.success(t('employees.createSuccess'));
      onOpenChange(false);
      onSuccess?.(result);
    } catch (error) {
      toast.error(getFreightApiErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('employees.addNewEmployee')}</DialogTitle>
          <DialogDescription>{t('employees.addDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('employees.fields.fullName')}</Label>
            <Input id="fullName" {...form.register('fullName')} />
            {form.formState.errors.fullName && (
              <p className="text-sm text-destructive">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="branch">{t('employees.fields.branch')}</Label>
              <Input id="branch" {...form.register('branch')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">
                {t('employees.fields.department')}
              </Label>
              <Input id="department" {...form.register('department')} />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {createMutation.isPending ? tCommon('saving') : tCommon('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
