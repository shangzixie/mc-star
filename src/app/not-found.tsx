/**
 * Catching non-localized requests
 *
 * This page renders when a route like `/unknown.txt` is requested.
 * In this case, the layout at `app/[locale]/layout.tsx` receives
 * an invalid value as the `[locale]` param and calls `notFound()`.
 *
 * https://next-intl.dev/docs/environments/error-files#catching-non-localized-requests
 */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="text-balance text-muted-foreground">
            The page you’re looking for doesn’t exist.
          </p>
          <a
            href="/"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Go back home
          </a>
        </main>
      </body>
    </html>
  );
}
