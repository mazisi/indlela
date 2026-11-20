import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatDate';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useOverview } from '../hooks/useSearchConsole';
import { REPORT_TABS } from '../hooks/useScParams';
import { COMPARE_OPTIONS } from '../lib/dateRange';
import type { MetricKey } from '../lib/metrics';
import type { ReportKey, ReportScope } from '../types';
import { KpiTiles, KpiTilesSkeleton } from './KpiTiles';
import { PerformanceChart, PerformanceChartSkeleton } from './PerformanceChart';
import { ReportPanel } from './reports/ReportPanel';

interface Props {
  scope: ReportScope;
  tab: ReportKey;
  onTabChange: (tab: ReportKey) => void;
}

/** A linked site with data: KPI tiles, the chart and the report tabs. */
export function Dashboard({ scope, tab, onTabChange }: Props) {
  const [metric, setMetric] = useState<MetricKey>('clicks');
  const overview = useOverview(scope);
  const compare = COMPARE_OPTIONS.find((o) => o.key === scope.compare);
  const data = overview.data;

  return (
    <div className="space-y-4">
      {overview.isError ? (
        <FormAlert tone="error">
          <p>{getApiErrorMessage(overview.error, 'We could not load the summary.')}</p>
          <p>
            <button type="button" className="font-medium underline" onClick={() => overview.refetch()}>
              Try again
            </button>
          </p>
        </FormAlert>
      ) : !data ? (
        <>
          <KpiTilesSkeleton />
          <PerformanceChartSkeleton />
        </>
      ) : (
        <div className={cn('space-y-4 transition-opacity', overview.isFetching && overview.isPlaceholderData && 'opacity-60')}>
          <p className="text-xs text-muted-foreground">
            {formatDate(data.period.start)} – {formatDate(data.period.end)}
            {data.comparePeriod && (
              <>
                {' '}
                · compared with {formatDate(data.comparePeriod.start)} – {formatDate(data.comparePeriod.end)}
              </>
            )}
          </p>
          <KpiTiles totals={data.totals} compareTotals={data.compareTotals} compareLabel={compare?.short ?? ''} selected={metric} onSelect={setMetric} />
          <PerformanceChart metric={metric} series={data.series} compareSeries={data.compareSeries} compareLabel={compare?.label ?? 'Compare'} />
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => onTabChange(v as ReportKey)} className="gap-3">
        <div className="overflow-x-auto border-b">
          <TabsList aria-label="Reports">
            {REPORT_TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {REPORT_TABS.map((t) => (
          <TabsContent key={t.key} value={t.key}>
            {t.key === tab && <ReportPanel key={`${t.key}-${scope.siteId}`} report={t.key} scope={scope} />}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
