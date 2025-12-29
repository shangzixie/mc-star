import { websiteConfig } from '@/config/website';
import { getLocalePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import type { Locale } from 'next-intl';
import { getBaseUrl } from './urls/urls';

type Href = Parameters<typeof getLocalePathname>[0]['href'];

/**
 * Get the proper hreflang value for a locale
 * Reads from website config, falls back to locale code if not configured
 */
export function getHreflangValue(locale: Locale): string {
  const localeConfig = websiteConfig.i18n.locales[locale];
  return localeConfig?.hreflang || locale;
}

/**
 * Generate hreflang URLs for all locales for a given path
 * Following Google's best practices:
 * 1. Self-referencing hreflang tag
 * 2. Identical set of hreflang tags across all page versions
 * 3. x-default tag for unmatched languages
 */
export function generateHreflangUrls(href: Href): Record<string, string> {
  const hreflangUrls: Record<string, string> = {};

  // Generate URLs for each supported locale
  routing.locales.forEach((locale) => {
    const pathname = getLocalePathname({ locale, href });
    const fullUrl = getBaseUrl() + pathname;
    const hreflangValue = getHreflangValue(locale);

    hreflangUrls[hreflangValue] = fullUrl;
  });

  // Add x-default pointing to the default locale
  const defaultPathname = getLocalePathname({
    locale: routing.defaultLocale,
    href,
  });
  const defaultUrl = getBaseUrl() + defaultPathname;
  hreflangUrls['x-default'] = defaultUrl;

  return hreflangUrls;
}

/**
 * Get current locale's hreflang value
 */
export function getCurrentHreflang(locale: Locale): string {
  return getHreflangValue(locale);
}

/**
 * Generate alternates object for Next.js metadata
 * https://nextjs.org/docs/app/api-reference/functions/generate-metadata#alternates
 */
export function generateAlternates(href: Href) {
  const hreflangUrls = generateHreflangUrls(href);

  return {
    languages: Object.fromEntries(
      Object.entries(hreflangUrls).filter(([key]) => key !== 'x-default')
    ),
  };
}
