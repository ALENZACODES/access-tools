import type { CacheStatus } from "./index";
import { catalog, type Locale } from "./catalog";

export interface StatusPanelProps {
  locale: Locale;
  status: CacheStatus;
}

export function StatusPanel({ locale, status }: StatusPanelProps) {
  const t = catalog[locale];
  return (
    <section aria-labelledby="tile-cache-title" lang={locale}>
      <h1 id="tile-cache-title">{t.title}</h1>
      <p>{t.notice}</p>
      {status.entries === 0 && <p role="status">{t.empty}</p>}
      <dl>
        <dt>{t.entries}</dt><dd>{status.entries}</dd>
        <dt>{t.bytes}</dt><dd>{status.bytesUsed}</dd>
        <dt>{t.cap}</dt><dd>{status.capBytes}</dd>
        <dt>{t.asOf}</dt><dd>{status.asOf ?? t.unknown}</dd>
        <dt>{t.licence}</dt>
        <dd>{status.credits.length ? status.credits.map((credit) => credit.licence).join(", ") : t.unknown}</dd>
        <dt>{t.attribution}</dt>
        <dd>{status.credits.length ? status.credits.map((credit) => credit.text).join("; ") : t.none}</dd>
      </dl>
    </section>
  );
}
