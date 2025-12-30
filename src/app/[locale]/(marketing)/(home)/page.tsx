import { localeRedirect } from '@/i18n/navigation';
import { Routes } from '@/routes';
import type { Locale } from 'next-intl';

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function HomePage(props: HomePageProps) {
  const { locale } = await props.params;
  localeRedirect({ href: Routes.Login, locale });
}
