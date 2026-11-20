import showToaster from '@/utils/showToaster';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { copyText } from '../lib/clipboard';
import { saveFile } from '../lib/download';
import type { ReportRow, ShareExpiry } from '../types';
import { useDeleteReport, useDownloadReport, useRevokeShare, useShareReport } from './useReports';

/**
 * What can be done to a site's report from its list or its preview:
 * download the PDF, copy the share link (creating it first when there is
 * none), revoke the link and delete. Each says how it went in a toast.
 */
export function useReportActions(siteId: number) {
  const download = useDownloadReport();
  const share = useShareReport(siteId);
  const revoke = useRevokeShare(siteId);
  const remove = useDeleteReport(siteId);

  const downloadPdf = (row: Pick<ReportRow, 'id'>) =>
    download.mutate(row.id, {
      onSuccess: (file) => saveFile(file),
      // A blob error body can't be read as JSON: say it plainly.
      onError: () => showToaster('error', 'The PDF could not be downloaded. Try again in a moment.'),
    });

  /** Copies the link; with no link yet, creates one that expires after `expiresInDays` (null: never). */
  const copyLink = async (row: ReportRow, expiresInDays: ShareExpiry = 30): Promise<boolean> => {
    let url = row.share?.url;
    if (!url) {
      try {
        url = (await share.mutateAsync({ id: row.id, expiresInDays })).share?.url;
      } catch (error) {
        showToaster('error', getApiErrorMessage(error, 'The share link could not be created.'));
        return false;
      }
    }
    if (!url) return false;
    const created = !row.share;
    if (await copyText(url)) showToaster('success', created ? 'Share link created and copied.' : 'Share link copied.');
    else showToaster('default', `${created ? 'Share link created. ' : ''}Copy it: ${url}`, { duration: 15_000 });
    return true;
  };

  const revokeLink = async (row: ReportRow): Promise<boolean> => {
    try {
      await revoke.mutateAsync(row.id);
      showToaster('success', 'Share link revoked. Anyone with it now sees that it is no longer available.');
      return true;
    } catch (error) {
      showToaster('error', getApiErrorMessage(error, 'The share link could not be revoked.'));
      return false;
    }
  };

  const deleteReport = async (row: ReportRow): Promise<boolean> => {
    try {
      await remove.mutateAsync(row.id);
      showToaster('success', `“${row.title}” deleted.`);
      return true;
    } catch (error) {
      showToaster('error', getApiErrorMessage(error, 'The report could not be deleted.'));
      return false;
    }
  };

  return {
    downloadPdf,
    downloadingId: download.isPending ? download.variables : undefined,
    copyLink,
    sharingId: share.isPending ? share.variables?.id : undefined,
    revokeLink,
    revoking: revoke.isPending,
    deleteReport,
    deleting: remove.isPending,
  };
}

export type ReportActions = ReturnType<typeof useReportActions>;
