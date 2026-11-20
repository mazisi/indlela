import axiosClient from '@/api/axiosClient';
import { tidyDigitKeys } from '@/features/rank-tracking/api/rankTrackingApi';
import type { GenerateReportInput, ReportBulkAction, ReportDetail, ReportPage, ReportRow, ReportSchedule, ReportSite, ScheduleInput, SendReportInput, ShareExpiry } from '../types';
import { filenameFrom, type DownloadedFile } from '../lib/download';

/* ---- Workspace-wide ---- */

export async function getReportSites(): Promise<ReportSite[]> {
  const { data } = await axiosClient.get<{ data: ReportSite[] }>('/reports/sites');
  return data.data;
}

/* ---- A site's reports ---- */

export async function getSiteReports(siteId: number, query: { page: number; perPage: number }): Promise<ReportPage> {
  const { data } = await axiosClient.get<ReportPage>(`/sites/${siteId}/reports`, { params: query });
  return data;
}

/** 202: the report is built in the background (status `generating`). */
export async function generateReport(siteId: number, input: GenerateReportInput): Promise<ReportRow> {
  const { data } = await axiosClient.post<{ data: ReportRow }>(`/sites/${siteId}/reports`, input);
  return data.data;
}

export async function getSchedule(siteId: number): Promise<ReportSchedule | null> {
  const { data } = await axiosClient.get<{ data: ReportSchedule | null }>(`/sites/${siteId}/report-schedule`);
  return data.data;
}

export async function saveSchedule(siteId: number, input: ScheduleInput): Promise<ReportSchedule> {
  const { data } = await axiosClient.put<{ data: ReportSchedule }>(`/sites/${siteId}/report-schedule`, input);
  return data.data;
}

/**
 * "Send now": last month's report with the schedule's sections and note,
 * emailed to its recipients once generated (202, status `generating`). The
 * monthly send still happens on its day. 409 `no_schedule` without one.
 */
export async function sendScheduleNow(siteId: number): Promise<ReportRow> {
  const { data } = await axiosClient.post<{ data: ReportRow }>(`/sites/${siteId}/report-schedule/send-now`);
  return data.data;
}

/* ---- One report ---- */

/** The figures' keys may carry digits (`top_3`): tidied like rank tracking's. */
export async function getReport(id: number): Promise<ReportDetail> {
  const { data } = await axiosClient.get<{ data: unknown }>(`/reports/${id}`);
  return tidyDigitKeys<ReportDetail>(data.data);
}

/** The PDF as a file (blob responses skip the case transform). */
export async function downloadReportPdf(id: number): Promise<DownloadedFile> {
  const res = await axiosClient.get<Blob>(`/reports/${id}/pdf`, { responseType: 'blob', headers: { Accept: 'application/pdf' } });
  return { blob: res.data, filename: filenameFrom(res.headers['content-disposition'] as string | undefined, `report-${id}.pdf`) };
}

/** 409 `report_not_ready` while it is still generating (or failed). */
export async function sendReport(id: number, input: SendReportInput): Promise<ReportRow> {
  const { data } = await axiosClient.post<{ data: ReportRow }>(`/reports/${id}/send`, input);
  return data.data;
}

export async function shareReport(id: number, expiresInDays: ShareExpiry): Promise<ReportRow> {
  const { data } = await axiosClient.post<{ data: ReportRow }>(`/reports/${id}/share`, { expiresInDays });
  return data.data;
}

export async function revokeShare(id: number): Promise<ReportRow> {
  const { data } = await axiosClient.delete<{ data: ReportRow }>(`/reports/${id}/share`);
  return data.data;
}

/** `affected`: reports deleted, or links revoked (only those that had one). All or nothing. */
export async function bulkReports(siteId: number, action: ReportBulkAction, ids: number[]): Promise<{ affected: number }> {
  const { data } = await axiosClient.post<{ affected: number }>(`/sites/${siteId}/reports/bulk`, { action, ids });
  return data;
}

export async function deleteReport(id: number): Promise<void> {
  await axiosClient.delete(`/reports/${id}`);
}
