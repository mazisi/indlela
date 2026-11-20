import { Link } from 'react-router';
import { AlertCircle, CalendarClock, FileText, Globe, Link2, Palette, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StateCard, StateCardPoints } from '@/components/page/StateCard';

export function NoSitesState() {
  return (
    <StateCard icon={Globe} title="No sites to report on yet">
      <p className="mt-1 max-w-md text-sm text-muted-foreground">Add your clients' websites first; you can then send them branded monthly reports.</p>
      <Button asChild variant="outline" className="mt-5">
        <Link to="/dashboard/clients/sites">Go to Sites</Link>
      </Button>
    </StateCard>
  );
}

export function SiteNotFoundState() {
  return (
    <StateCard icon={AlertCircle} tone="bad" title="Site not found">
      <p className="mt-1 max-w-md text-sm text-muted-foreground">This site doesn't exist or you don't have access to it.</p>
      <Button asChild variant="outline" className="mt-5">
        <Link to="/dashboard/reports">Back to Reports</Link>
      </Button>
    </StateCard>
  );
}

export function ReportNotFoundState({ siteId }: { siteId: number }) {
  return (
    <StateCard icon={AlertCircle} tone="bad" title="Report not found">
      <p className="mt-1 max-w-md text-sm text-muted-foreground">This report was deleted, or you don't have access to it.</p>
      <Button asChild variant="outline" className="mt-5">
        <Link to={`/dashboard/reports/${siteId}`}>Back to the site's reports</Link>
      </Button>
    </StateCard>
  );
}

const WHAT_YOU_GET = [
  { icon: Sparkles, title: 'Plain-language summary', text: '“Traffic up 14%, 6 keywords entered the top 10, 2 issues need attention” at the top.' },
  { icon: Palette, title: 'Your brand, not ours', text: 'Your logo, name and brand colour on the PDF and the share page. No mention of Indlela.' },
  { icon: Link2, title: 'PDF and share link', text: 'Download a PDF, or send a link that works without signing in, for as long as you choose.' },
  { icon: CalendarClock, title: 'Monthly, automatically', text: 'Schedule a report on the previous month, emailed to your client on the day you pick.' },
];

export function NoReportsState({ canCreate, onGenerate, onSchedule }: { canCreate: boolean; onGenerate: () => void; onSchedule: () => void }) {
  return (
    <StateCard icon={FileText} title="No reports for this site yet">
      <p className="mt-1 max-w-lg text-sm text-muted-foreground">A report brings Search Console, rankings and the site audit together for your client, with a short summary they can read in ten seconds.</p>
      <StateCardPoints points={WHAT_YOU_GET} />
      {canCreate ? (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={onGenerate}>
            <Plus />
            Generate report
          </Button>
          <Button variant="outline" onClick={onSchedule}>
            <CalendarClock />
            Schedule monthly
          </Button>
        </div>
      ) : (
        <p className="mt-6 rounded border border-dashed px-3 py-2 text-sm text-muted-foreground">No reports have been shared with you for this site yet.</p>
      )}
    </StateCard>
  );
}
