import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useClientSort } from './useClientSort';

const rows = [
  { name: 'Heritage Day', factor: 1.4 },
  { name: 'Christmas Day', factor: 0.6 },
  { name: 'Election Day', factor: null },
  { name: 'Day of Goodwill', factor: 1.2 },
];

describe('useClientSort', () => {
  it('sorts ascending, then descending, then back to the table’s own order, rows without a value last', () => {
    const { result } = renderHook(() => useClientSort(rows, { name: (r) => r.name, factor: (r) => r.factor }));
    const names = () => result.current.rows.map((r) => r.name);
    expect(names()).toEqual(['Heritage Day', 'Christmas Day', 'Election Day', 'Day of Goodwill']);

    act(() => result.current.onSort('factor'));
    expect(names()).toEqual(['Christmas Day', 'Day of Goodwill', 'Heritage Day', 'Election Day']);
    act(() => result.current.onSort('factor'));
    expect(names()).toEqual(['Heritage Day', 'Day of Goodwill', 'Christmas Day', 'Election Day']);
    expect(result.current.sort).toEqual({ key: 'factor', direction: 'desc' });
    act(() => result.current.onSort('factor'));
    expect(names()).toEqual(['Heritage Day', 'Christmas Day', 'Election Day', 'Day of Goodwill']);

    act(() => result.current.onSort('name'));
    expect(names()).toEqual(['Christmas Day', 'Day of Goodwill', 'Election Day', 'Heritage Day']);
  });
});
