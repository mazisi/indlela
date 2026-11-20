import axios from 'axios';
import { snakeToCamelCase } from '@/utils/snakeToCamelCase';
import { tidyDigitKeys } from '@/features/rank-tracking/api/rankTrackingApi';
import type { PublicReport } from '../types';

const API_URL: string = import.meta.env.VITE_API_URL ?? '';

/**
 * The client-facing share page is not signed in: a plain client, without the
 * app's token, 401 handling or redirects, so it never sends the viewer to
 * the login page (even in a browser that is signed in to Indlela).
 */
const publicClient = axios.create({ baseURL: API_URL, headers: { Accept: 'application/json' } });

/** 404 when the link is unknown, revoked or expired. */
export async function getPublicReport(token: string): Promise<PublicReport> {
  const { data } = await publicClient.get<{ data: unknown }>(`/public/reports/${encodeURIComponent(token)}`);
  return tidyDigitKeys<PublicReport>(snakeToCamelCase(data.data));
}

/** A plain link: the browser downloads the PDF itself. */
export const publicPdfUrl = (token: string) => `${API_URL}/public/reports/${encodeURIComponent(token)}/pdf`;
