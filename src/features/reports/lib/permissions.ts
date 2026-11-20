/**
 * The Reports page's permissions (resource `reports` in the API's
 * App\Support\Permissions). Create covers generating, sending, sharing and
 * scheduling; the Client role has view only.
 */
export const REPORT_PERMISSIONS = {
  view: 'view_reports',
  create: 'create_reports',
  delete: 'delete_reports',
} as const;
