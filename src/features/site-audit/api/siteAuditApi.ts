import axiosClient from '@/api/axiosClient';
import type { ResourcePage } from '@/types/pagination';
import type {
  AffectedUrl,
  Audit,
  AuditSettings,
  AuditSite,
  ChangeFilter,
  ComparisonRow,
  CrawledPage,
  CrawledPageDetail,
  IssueGroup,
  ListQuery,
  PagesQuery,
  VitalsRow,
} from '../types';

/** Rows without an id of their own get their place in the result (stable for a page), for the shared DataTable. */
function withRowIds<T>(page: ResourcePage<T>): ResourcePage<T & { id: number }> {
  const offset = (page.meta.currentPage - 1) * page.meta.perPage;
  return { ...page, data: page.data.map((row, i) => ({ ...row, id: offset + i + 1 })) };
}

/* ---- Sites ---- */

export async function getAuditSites(): Promise<AuditSite[]> {
  const { data } = await axiosClient.get<{ data: AuditSite[] }>('/site-audit/sites');
  return data.data;
}

export async function saveAuditSettings(siteId: number, settings: AuditSettings): Promise<AuditSite> {
  const { data } = await axiosClient.put<{ data: AuditSite }>(`/sites/${siteId}/audit-settings`, settings);
  return data.data;
}

/* ---- Audits ---- */

export async function getAudits(siteId: number, query: ListQuery): Promise<ResourcePage<Audit>> {
  const { data } = await axiosClient.get<ResourcePage<Audit>>(`/sites/${siteId}/audits`, { params: { page: query.page, perPage: query.perPage } });
  return data;
}

/** 202 with the queued audit; 409 `audit_running` when one is already under way. */
export async function startAudit(siteId: number): Promise<Audit> {
  const { data } = await axiosClient.post<{ data: Audit }>(`/sites/${siteId}/audits`);
  return data.data;
}

export async function getAudit(auditId: number): Promise<Audit> {
  const { data } = await axiosClient.get<{ data: Audit }>(`/audits/${auditId}`);
  return data.data;
}

export async function cancelAudit(auditId: number): Promise<Audit> {
  const { data } = await axiosClient.post<{ data: Audit }>(`/audits/${auditId}/cancel`);
  return data.data;
}

/* ---- An audit's findings ---- */

export async function getIssueGroups(auditId: number): Promise<IssueGroup[]> {
  const { data } = await axiosClient.get<{ data: IssueGroup[] }>(`/audits/${auditId}/issues`);
  return data.data;
}

export async function getAffectedUrls(auditId: number, type: string, query: ListQuery): Promise<ResourcePage<AffectedUrl & { id: number }>> {
  const { data } = await axiosClient.get<ResourcePage<AffectedUrl>>(`/audits/${auditId}/issues/${encodeURIComponent(type)}`, {
    params: { page: query.page, perPage: query.perPage, search: query.search || undefined },
  });
  return withRowIds(data);
}

export async function getCrawledPages(auditId: number, query: PagesQuery): Promise<ResourcePage<CrawledPage>> {
  const { data } = await axiosClient.get<ResourcePage<CrawledPage>>(`/audits/${auditId}/pages`, {
    params: {
      page: query.page,
      perPage: query.perPage,
      search: query.search || undefined,
      status: query.status,
      indexable: query.indexable === undefined ? undefined : query.indexable ? 1 : 0,
      sort: query.sort,
    },
  });
  return data;
}

export async function getCrawledPage(auditId: number, pageId: number): Promise<CrawledPageDetail> {
  const { data } = await axiosClient.get<{ data: CrawledPageDetail }>(`/audits/${auditId}/pages/${pageId}`);
  return data.data;
}

export async function getVitals(auditId: number): Promise<VitalsRow[]> {
  const { data } = await axiosClient.get<{ data: VitalsRow[] }>(`/audits/${auditId}/vitals`);
  return data.data;
}

export async function getComparison(auditId: number, filter: ChangeFilter, query: ListQuery): Promise<ResourcePage<ComparisonRow & { id: number }>> {
  const { data } = await axiosClient.get<ResourcePage<ComparisonRow>>(`/audits/${auditId}/comparison`, {
    params: { filter, page: query.page, perPage: query.perPage },
  });
  return withRowIds(data);
}
