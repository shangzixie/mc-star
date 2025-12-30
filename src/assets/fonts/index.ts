/**
 * Fonts (offline-friendly)
 *
 * This project previously used `next/font/google`, which downloads fonts at
 * build time. In environments without external network access (CI / sandbox),
 * that fails the production build.
 *
 * We now rely on Tailwind v4 font tokens defined in `src/styles/globals.css`.
 * If you want to self-host actual font files, switch to `next/font/local` and
 * add woff2 files under this folder.
 */

export type AppFont = {
  className: string;
  variable: string;
};

// Apply the default sans stack (see globals.css).
export const fontNotoSans: AppFont = {
  className: 'font-sans',
  variable: '',
};

// Expose tokens for convenience/compatibility with the existing layout code.
export const fontNotoSerif: AppFont = {
  className: '',
  variable: '',
};

export const fontNotoSansMono: AppFont = {
  className: '',
  variable: '',
};

export const fontBricolageGrotesque: AppFont = {
  className: '',
  variable: '',
};
