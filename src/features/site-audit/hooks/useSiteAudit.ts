import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelAudit,
  getAffectedUrls,
  getAudit,
  getAuditSites,
  getAudits,
  getComparison,
  getCrawledPage,
  getCrawledPages,
  getIssueGroups,
  getVitals,
  saveAuditSettings,
  startAudit,
} from '../api/siteAuditApi';
import { isRunning } from '../lib/auditStatus';
import type { Audit, AuditSettings, AuditSite, ChangeFilter, ListQuery, PagesQuery } from '../types';

/** A running audit is polled every 3 s. */
export const POLL_MS = 3_000;
/** The sites list, while any of its audits runs (progress in the overview). */
export const SITES_POLL_MS = 5_000;
/** PageSpeed checks finish after the crawl: the audit is re-read this often until they do. */
export const VITALS_POLL_MS = 10_000;

export const auditKeys = {
  all: ['site-audit'] as const,
  sites: () => [...auditKeys.all, 'sites'] as const,
  audits: (siteId: number) => [...auditKeys.all, 'site', siteId, 'audits'] as const,
  auditList: (siteId: number, query: ListQuery) => [...auditKeys.audits(siteId), query] as const,
  audit: (auditId: number) => [...auditKeys.all, 'audit', auditId] as const,
  issues: (auditId: number) => [...auditKeys.audit(auditId), 'issues'] as const,
  affected: (auditId: number, type: string, query: ListQuery) => [...auditKeys.issues(auditId), type, query] as const,
  pages: (auditId: number, query: PagesQuery) => [...auditKeys.audit(auditId), 'pages', query] as const,
  page: (auditId: number, pageId: number) => [...auditKeys.audit(auditId), 'page', pageId] as const,
  vitals: (auditId: number, status: string) => [...auditKeys.audit(auditId), 'vitals', status] as const,
  comparison: (auditId: number, filter: ChangeFilter, query: ListQuery) => [...auditKeys.audit(auditId), 'comparison', filter, query] as const,
};

export const useAuditSites = () =>
  useQuery({
    queryKey: auditKeys.sites(),
    queryFn: getAuditSites,
    refetchInterval: (query) => (query.state.data?.some((s) => s.runningAudit) ? SITES_POLL_MS : false),
  });

export const useAudits = (siteId: number, query: ListQuery, enabled = true) =>
  useQuery({ queryKey: auditKeys.auditList(siteId, query), queryFn: () => getAudits(siteId, query), enabled, placeholderData: keepPreviousData });

/**
 * One audit. Polled every 3 s while it runs, and every 10 s while a finished
 * audit's PageSpeed checks are still pending.
 */
export const useAudit = (auditId: number | undefined) =>
  useQuery({
    queryKey: auditKeys.audit(auditId ?? 0),
    queryFn: () => getAudit(auditId as number),
    enabled: Boolean(auditId),
    refetchInterval: (query) => {
      const audit = query.state.data;
      if (isRunning(audit)) return POLL_MS;
      return audit?.status === 'done' && audit.vitalsStatus === 'pending' ? VITALS_POLL_MS : false;
    },
  });

export const useIssueGroups = (auditId: number) => useQuery({ queryKey: auditKeys.issues(auditId), queryFn: () => getIssueGroups(auditId) });

export const useAffectedUrls = (auditId: number, type: string, query: ListQuery) =>
  useQuery({ queryKey: auditKeys.affected(auditId, type, query), queryFn: () => getAffectedUrls(auditId, type, query), placeholderData: keepPreviousData });

export const useCrawledPages = (auditId: number, query: PagesQuery) =>
  useQuery({ queryKey: auditKeys.pages(auditId, query), queryFn: () => getCrawledPages(auditId, query), placeholderData: keepPreviousData });

export const useCrawledPage = (auditId: number, pageId: number | undefined) =>
  useQuery({ queryKey: auditKeys.page(auditId, pageId ?? 0), queryFn: () => getCrawledPage(auditId, pageId as number), enabled: Boolean(pageId) });

/** Keyed by the audit's vitals status, so the results load again once the checks finish. */
export const useVitals = (audit: Audit) =>
  useQuery({ queryKey: auditKeys.vitals(audit.id, audit.vitalsStatus), queryFn: () => getVitals(audit.id), enabled: audit.vitalsStatus !== 'unavailable' });

export const useComparison = (auditId: number, filter: ChangeFilter, query: ListQuery, enabled: boolean) =>
  useQuery({
    queryKey: auditKeys.comparison(auditId, filter, query),
    queryFn: () => getComparison(auditId, filter, query),
    enabled,
    placeholderData: keepPreviousData,
  });

/** Writes a site's running audit into the sites list at once, so polling starts without waiting for a refetch. */
function useSetRunning() {
  const queryClient = useQueryClient();
  return (siteId: number, audit: Audit | null) =>
    queryClient.setQueryData<AuditSite[]>(auditKeys.sites(), (sites) => sites?.map((s) => (s.id === siteId ? { ...s, runningAudit: audit } : s)));
}

export const useStartAudit = () => {
  const setRunning = useSetRunning();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (siteId: number) => startAudit(siteId),
    onSuccess: (audit, siteId) => {
      queryClient.setQueryData(auditKeys.audit(audit.id), audit);
      setRunning(siteId, audit);
    },
  });
};

export const useCancelAudit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (auditId: number) => cancelAudit(auditId),
    onSuccess: (audit) => queryClient.setQueryData(auditKeys.audit(audit.id), audit),
  });
};

export const useSaveAuditSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ siteId, settings }: { siteId: number; settings: AuditSettings }) => saveAuditSettings(siteId, settings),
    onSuccess: (saved) => {
      // Keep the list's audits: the settings response may not carry them.
      queryClient.setQueryData<AuditSite[]>(auditKeys.sites(), (sites) =>
        sites?.map((s) => (s.id === saved.id ? { ...s, auditSchedule: saved.auditSchedule, auditPageLimit: saved.auditPageLimit } : s)),
      );
      void queryClient.invalidateQueries({ queryKey: auditKeys.sites() });
    },
  });
};

/** After a running audit stops: the sites list (latest / running audit) and the site's history change. */
export function useRefreshAfterRun() {
  const queryClient = useQueryClient();
  return (siteId: number) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: auditKeys.sites() }),
      queryClient.invalidateQueries({ queryKey: auditKeys.audits(siteId) }),
    ]);
}
