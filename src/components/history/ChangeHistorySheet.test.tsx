import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChangeHistorySheet } from './ChangeHistorySheet';
import type { ChangeEntry } from '@/types/history';

const entry = (over: Partial<ChangeEntry>): ChangeEntry => ({
  id: 1,
  at: '2026-09-29T12:54:00+02:00',
  action: 'update',
  user: 'Johan Benecke',
  recordId: '19',
  recordLabel: 'Grindrod Bank',
  changes: [],
  ...over,
});

const renderSheet = (entries: ChangeEntry[]) =>
  render(
    <ChangeHistorySheet
      open
      onOpenChange={vi.fn()}
      pageTitle="Banks and branch codes"
      history={{ data: entries, meta: { currentPage: 1, lastPage: 1, perPage: 15, total: entries.length, from: 1, to: entries.length } }}
      isPending={false}
      isError={false}
      onRetry={vi.fn()}
      onPageChange={vi.fn()}
      fieldLabels={{ is_active: 'Active', branches: 'Other branch codes', name: 'Bank name' }}
    />,
  );

describe('ChangeHistorySheet', () => {
  it('shows who changed what, old to new, and hides no-op and unlabelled fields', () => {
    renderSheet([
      entry({
        changes: [
          { field: 'is_active', old: true, new: false },
          { field: 'branches', old: null, new: '' },
          { field: 'secret_column', old: 'a', new: 'b' },
        ],
      }),
    ]);

    expect(screen.getByText('Changed')).toBeInTheDocument();
    expect(screen.getByText('Grindrod Bank')).toBeInTheDocument();
    expect(screen.getByText(/Johan Benecke/)).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.queryByText('Other branch codes')).not.toBeInTheDocument();
    expect(screen.queryByText('secret_column')).not.toBeInTheDocument();
  });

  it('says so when nothing has changed yet', () => {
    renderSheet([]);
    expect(screen.getByText('No changes yet')).toBeInTheDocument();
  });
});
