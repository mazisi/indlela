import type { ReactNode } from 'react';
import { Building2, Globe } from 'lucide-react';
import type { ReportBranding, ReportSnapshot } from '../../types';

/** The agency's logo on a white tile (it reads on any brand colour), or its initial. */
export function AgencyMark({ branding }: { branding: Pick<ReportBranding, 'name' | 'logoUrl'> }) {
  if (branding.logoUrl) {
    return (
      <span className="grid h-12 max-w-40 shrink-0 place-items-center rounded bg-white px-2 py-1.5 shadow-xs">
        <img src={branding.logoUrl} alt={`${branding.name} logo`} className="max-h-full max-w-full object-contain" />
      </span>
    );
  }
  return (
    <span className="grid size-12 shrink-0 place-items-center rounded bg-white text-xl font-bold text-(--brand-accent) shadow-xs" aria-hidden>
      {branding.name.charAt(0).toUpperCase()}
    </span>
  );
}

interface Props {
  title: string;
  periodLabel: string;
  branding: ReportBranding;
  data: ReportSnapshot;
  /** e.g. the share page's Download PDF button. */
  action?: ReactNode;
}

/**
 * The report's branded card (as wide as the content below): the agency's logo and name, the report's title,
 * who it's for and the period, in the agency's colour with text that stays
 * readable on it.
 */
export function ReportHeader({ title, periodLabel, branding, data, action }: Props) {
  const forWhom = [data.client?.name, data.site?.name].filter(Boolean).join(' · ');
  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 sm:pt-8">
      <header
        className="relative isolate overflow-hidden rounded bg-(--brand) text-(--brand-ink) shadow-sm print:shadow-none print:[print-color-adjust:exact]"
        data-testid="report-header"
      >
        {/* Decoration: a soft light from the top left and two rings on the right, in the ink colour so they suit any brand. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_0%_0%,rgb(255_255_255/0.14),transparent_60%)]" />
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 -z-10 size-72 rounded-full border-[28px] border-current opacity-[0.07]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 right-24 -z-10 size-56 rounded-full border-[18px] border-current opacity-[0.05]" />

        <div className="flex items-center justify-between gap-3 border-b border-current/15 px-5 py-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <AgencyMark branding={branding} />
            <p className="truncate text-sm font-semibold" data-testid="agency-name">
              {branding.name}
            </p>
          </div>
          {action}
        </div>

        <div className="space-y-3 px-5 py-6 sm:px-8 sm:py-7">
          <p className="text-2xs font-semibold uppercase tracking-wider opacity-80">{periodLabel}</p>
          <h1 className="max-w-3xl text-xl font-bold leading-tight">{title}</h1>
          {(forWhom || data.site?.url) && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              {forWhom && (
                <span className="inline-flex items-center gap-1.5 rounded bg-current/10 px-2 py-1 font-medium">
                  <Building2 className="size-3.5 opacity-80" aria-hidden />
                  <span className="text-(--brand-ink)">{forWhom}</span>
                </span>
              )}
              {data.site?.url && (
                <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded bg-current/10 px-2 py-1">
                  <Globe className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  <span className="truncate text-(--brand-ink)">{data.site.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
