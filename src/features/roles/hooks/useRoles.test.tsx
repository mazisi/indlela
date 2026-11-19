import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateRolePermissions } from './useRoles';
import * as api from '../api/rolesApi';

vi.mock('../api/rolesApi');

describe('useUpdateRolePermissions', () => {
  it("refreshes the user's own permissions, so the menu changes without a reload", async () => {
    vi.mocked(api.updateRolePermissions).mockResolvedValue({} as Awaited<ReturnType<typeof api.updateRolePermissions>>);
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useUpdateRolePermissions(), { wrapper });

    result.current.mutate({ id: 1, permissions: ['view_clients_sites'] });

    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['me'] }));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['roles'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['users', 'options'] });
  });
});
