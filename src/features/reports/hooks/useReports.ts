import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  bulkReports,
  deleteReport,
  downloadReportPdf,
  generateReport,
  getReport,
  getReportSites,
  getSchedule,
  getSiteReports,
  revokeShare,
  saveSchedule,
  sendReport,
  sendScheduleNow,
  shareReport,
} from '../api/reportsApi';
import type { GenerateReportInput, ReportBulkAction, ReportDetail, ReportPage, ReportRow, ScheduleInput, SendReportInput, ShareExpiry } from '../types';

/** A list or report still generating is re-read this often. */
export const REPORT_POLL_MS = 3_000;

export const reportKeys = {
  all: ['reports'] as const,
  sites: () => [...reportKeys.all, 'sites'] as const,
  site: (siteId: number) => [...reportKeys.all, 'site', siteId] as const,
  list: (siteId: number, query: { page: number; perPage: number }) => [...reportKeys.site(siteId), 'list', query] as const,
  schedule: (siteId: number) => [...reportKeys.site(siteId), 'schedule'] as const,
  report: (id: number) => [...reportKeys.all, 'report', id] as const,
};

export const isGenerating = (page: ReportPage | undefined) => Boolean(page?.data.some((r) => r.status === 'generating'));

export const useReportSites = () => useQuery({ queryKey: reportKeys.sites(), queryFn: getReportSites });

/** Polls while a report on the page is generating, so it turns ready (or failed) by itself. */
export const useSiteReports = (siteId: number, query: { page: number; perPage: number }, enabled = true) =>
  useQuery({
    queryKey: reportKeys.list(siteId, query),
    queryFn: () => getSiteReports(siteId, query),
    enabled,
    placeholderData: keepPreviousData,
    refetchInterval: (q) => (isGenerating(q.state.data) ? REPORT_POLL_MS : false),
  });

export const useReportSchedule = (siteId: number, enabled = true) =>
  useQuery({ queryKey: reportKeys.schedule(siteId), queryFn: () => getSchedule(siteId), enabled });

export const useReport = (id: number) =>
  useQuery({
    queryKey: reportKeys.report(id),
    queryFn: () => getReport(id),
    refetchInterval: (q) => (q.state.data?.status === 'generating' ? REPORT_POLL_MS : false),
  });

/** A site's lists and the overview's "last report" after any change. */
function useRefresh() {
  const queryClient = useQueryClient();
  return (siteId: number) =>
    Promise.all([queryClient.invalidateQueries({ queryKey: reportKeys.site(siteId) }), queryClient.invalidateQueries({ queryKey: reportKeys.sites() })]);
}

/** Writes a returned row into every cached page of the site's list and into the open report. */
function usePutRow() {
  const queryClient = useQueryClient();
  return (siteId: number, row: ReportRow) => {
    queryClient.setQueriesData<ReportPage>({ queryKey: [...reportKeys.site(siteId), 'list'] }, (page) =>
      page ? { ...page, data: page.data.map((r) => (r.id === row.id ? { ...r, ...row } : r)) } : page,
    );
    queryClient.setQueryData<ReportDetail>(reportKeys.report(row.id), (detail) => (detail ? { ...detail, ...row } : detail));
  };
}

export const useGenerateReport = (siteId: number) => {
  const refresh = useRefresh();
  return useMutation({ mutationFn: (input: GenerateReportInput) => generateReport(siteId, input), onSuccess: () => refresh(siteId) });
};

export const useSendScheduleNow = (siteId: number) => {
  const refresh = useRefresh();
  return useMutation({ mutationFn: () => sendScheduleNow(siteId), onSuccess: () => refresh(siteId) });
};

export const useSaveSchedule = (siteId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ScheduleInput) => saveSchedule(siteId, input),
    onSuccess: (schedule) => {
      queryClient.setQueryData(reportKeys.schedule(siteId), schedule);
      void queryClient.invalidateQueries({ queryKey: reportKeys.sites() });
    },
  });
};

export const useSendReport = (siteId: number) => {
  const put = usePutRow();
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: SendReportInput }) => sendReport(id, input),
    onSuccess: (row) => {
      put(siteId, row);
      void refresh(siteId);
    },
  });
};

export const useShareReport = (siteId: number) => {
  const put = usePutRow();
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, expiresInDays }: { id: number; expiresInDays: ShareExpiry }) => shareReport(id, expiresInDays),
    onSuccess: (row) => {
      put(siteId, row);
      void refresh(siteId);
    },
  });
};

export const useRevokeShare = (siteId: number) => {
  const put = usePutRow();
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: number) => revokeShare(id),
    onSuccess: (row) => {
      put(siteId, row);
      void refresh(siteId);
    },
  });
};

export const useDeleteReport = (siteId: number) => {
  const refresh = useRefresh();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteReport(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: reportKeys.report(id) });
      return refresh(siteId);
    },
  });
};

export const useBulkReports = (siteId: number) => {
  const refresh = useRefresh();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ action, ids }: { action: ReportBulkAction; ids: number[] }) => bulkReports(siteId, action, ids),
    onSuccess: (_, { action, ids }) => {
      if (action === 'delete') ids.forEach((id) => queryClient.removeQueries({ queryKey: reportKeys.report(id) }));
      else ids.forEach((id) => void queryClient.invalidateQueries({ queryKey: reportKeys.report(id) }));
      return refresh(siteId);
    },
  });
};

export const useDownloadReport = () => useMutation({ mutationFn: (id: number) => downloadReportPdf(id) });
