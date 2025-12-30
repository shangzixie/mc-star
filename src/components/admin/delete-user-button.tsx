'use client';

import { adminDeleteUserAction } from '@/actions/admin-delete-user';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { User } from '@/lib/auth-types';
import { Trash2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

interface DeleteUserButtonProps {
  user: User;
  onDeleteSuccess?: () => void;
}

export function DeleteUserButton({
  user,
  onDeleteSuccess,
}: DeleteUserButtonProps) {
  const t = useTranslations('Dashboard.admin.users.delete');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      const result = await adminDeleteUserAction({ userId: user.id });

      if (result?.data?.success) {
        toast.success(t('success'));
        setOpen(false);
        onDeleteSuccess?.();
      } else {
        toast.error(result?.data?.error || t('error'));
      }
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  // Don't show delete button for admin users
  if (user.role === 'admin') {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <Trash2Icon className="size-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Deleting...' : t('confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

