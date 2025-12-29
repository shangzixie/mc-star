import { LocaleLink } from '@/i18n/navigation';
import { constructMetadata } from '@/lib/metadata';
import { Routes } from '@/routes';
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
  const pt = await getTranslations({ locale, namespace: 'AuthPage.register' });

  return constructMetadata({
    title: pt('title') + ' | ' + t('title'),
    description: t('description'),
    locale,
    pathname: '/auth/register',
  });
}

export default async function RegisterPage() {
  const t = await getTranslations('AuthPage.common');
  const rt = await getTranslations('AuthPage.register');

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <div className="text-base font-medium text-foreground">
          {rt('registrationDisabledTitle')}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          {rt('registrationDisabledDescription')}
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <LocaleLink
            href={Routes.Login}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            {rt('backToLogin')}
          </LocaleLink>
          <LocaleLink
            href={Routes.Waitlist}
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground"
          >
            {rt('joinWaitlist')}
          </LocaleLink>
        </div>
      </div>
      <div className="text-balance text-center text-xs text-muted-foreground">
        {t('byClickingContinue')}
        <LocaleLink
          href={Routes.TermsOfService}
          className="underline underline-offset-4 hover:text-primary"
        >
          {t('termsOfService')}
        </LocaleLink>{' '}
        {t('and')}{' '}
        <LocaleLink
          href={Routes.PrivacyPolicy}
          className="underline underline-offset-4 hover:text-primary"
        >
          {t('privacyPolicy')}
        </LocaleLink>
      </div>
    </div>
  );
}
