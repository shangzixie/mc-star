import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { constructMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const pt = await getTranslations({
    locale,
    namespace: 'AuthPage.forgotPassword',
  });

  return constructMetadata({
    title: pt('title') + ' | ' + t('title'),
    description: t('description'),
    locale,
    pathname: '/auth/forgot-password',
  });
}

export default async function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
