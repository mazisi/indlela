export const LOCAL_GRID_PERMISSIONS = {
  view: 'view_local_grid',
  create: 'create_local_grid',
  update: 'update_local_grid',
  delete: 'delete_local_grid',
} as const;

export const overviewPath = () => '/dashboard/local-grid';
export const sitePath = (siteId: number) => `/dashboard/local-grid/${siteId}`;
export const gridPath = (siteId: number, gridId: number) => `/dashboard/local-grid/${siteId}/${gridId}`;
