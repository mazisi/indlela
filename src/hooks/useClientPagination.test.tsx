import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { useClientPagination } from './useClientPagination';

const rows = Array.from({ length: 40 }, (_, i) => i + 1);
const at = (url: string) => ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>;

describe('useClientPagination', () => {
  it('shows 15 a page by default, from the URL page', () => {
    const { result } = renderHook(() => useClientPagination(rows), { wrapper: at('/x?page=2') });
    expect(result.current.pageRows).toEqual(rows.slice(15, 30));
    expect(result.current.meta).toEqual({ currentPage: 2, lastPage: 3, total: 40, perPage: 15 });
  });

  it('shows the last page when the URL page is past the end', () => {
    const { result } = renderHook(() => useClientPagination(rows.slice(0, 5)), { wrapper: at('/x?page=4') });
    expect(result.current.meta.currentPage).toBe(1);
    expect(result.current.pageRows).toEqual([1, 2, 3, 4, 5]);
  });

  it('changes page and page size, a new size starting again on page 1', () => {
    const { result } = renderHook(() => useClientPagination(rows), { wrapper: at('/x') });
    act(() => result.current.onPageChange(3));
    expect(result.current.pageRows).toEqual(rows.slice(30, 40));
    act(() => result.current.onPerPageChange(20));
    expect(result.current.meta).toEqual({ currentPage: 1, lastPage: 2, total: 40, perPage: 20 });
    act(() => result.current.onPageChange(2));
    act(() => result.current.reset());
    expect(result.current.meta.currentPage).toBe(1);
  });

  it('has one empty page for no rows', () => {
    const { result } = renderHook(() => useClientPagination([]), { wrapper: at('/x') });
    expect(result.current.meta).toEqual({ currentPage: 1, lastPage: 1, total: 0, perPage: 15 });
  });
});
