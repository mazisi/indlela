import type { DataColumn } from '@/components/table/DataTable';
import type { Grid, LocalGridSite } from '../types';

/** Column shapes for the overview's loading table. */
export const SITE_COLUMNS_SKELETON: DataColumn<LocalGridSite, string>[] = [
  { label: 'Site', skeleton: 'w-40', cell: () => null },
  { label: 'Grids', skeleton: 'w-6', align: 'right', cell: () => null },
  { label: 'Latest scan', skeleton: 'w-36', cell: () => null },
  { label: 'Avg rank', skeleton: 'w-8', align: 'right', cell: () => null },
  { label: 'Top 3 share', skeleton: 'w-8', align: 'right', cell: () => null },
  { label: 'When', skeleton: 'w-20', cell: () => null },
];

/** Column shapes for the site page's loading table. */
export const GRID_COLUMNS_SKELETON: DataColumn<Grid, string>[] = [
  { label: 'Keyword', skeleton: 'w-40', cell: () => null },
  { label: 'Grid', skeleton: 'w-20', cell: () => null },
  { label: 'Heatmap', skeleton: 'h-11 w-11', cell: () => null },
  { label: 'Avg rank', skeleton: 'w-8', align: 'right', cell: () => null },
  { label: 'Top 3 share', skeleton: 'w-8', align: 'right', cell: () => null },
  { label: 'Found', skeleton: 'w-8', align: 'right', cell: () => null },
  { label: 'Last scan', skeleton: 'w-20', cell: () => null },
  { label: 'Schedule', skeleton: 'w-16', cell: () => null },
];
