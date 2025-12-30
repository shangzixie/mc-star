'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/use-current-user';
import { ShieldCheckIcon, UsersIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

/**
 * Admin section for dashboard
 * Only visible to admin users
 */
export function AdminSection() {
  const t = useTranslations('Dashboard');
  const user = useCurrentUser();

  // Only show to admin users
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="size-5 text-primary" />
            <CardTitle>{t('admin.title')}</CardTitle>
          </div>
          <CardDescription>
            Admin-only functions for managing users and system settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/admin/users">
              <Card className="cursor-pointer transition-colors hover:bg-accent">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <UsersIcon className="size-5 text-muted-foreground" />
                    <CardTitle className="text-base">
                      {t('admin.users.title')}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    Manage users, invite new users, and control access
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
