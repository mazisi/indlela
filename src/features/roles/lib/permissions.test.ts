import { describe, expect, it } from 'vitest';
import { checkState, sameSet, toggle } from './permissions';
import type { CatalogResource } from '../types';

const register: CatalogResource = { key: 'clients_sites', label: 'Sites', actions: ['view', 'create', 'update', 'delete', 'approve'], grantable: true };

describe('role permissions', () => {
  it('ticking an action ticks View too', () => {
    expect([...toggle(new Set(), register, 'approve', true)].sort()).toEqual(['approve_clients_sites', 'view_clients_sites']);
  });

  it('unticking View clears the page; unticking another action leaves the rest', () => {
    const all = new Set(register.actions.map((a) => `${a}_clients_sites`));
    expect(toggle(all, register, 'view', false).size).toBe(0);
    expect(toggle(all, register, 'delete', false).has('delete_clients_sites')).toBe(false);
    expect(toggle(all, register, 'delete', false).has('update_clients_sites')).toBe(true);
  });

  it('works out select-all state and compares sets', () => {
    const held = new Set(['view_clients_sites']);
    expect(checkState(held, ['view_clients_sites', 'create_clients_sites'])).toBe('indeterminate');
    expect(checkState(held, ['view_clients_sites'])).toBe(true);
    expect(checkState(held, ['create_clients_sites'])).toBe(false);
    expect(sameSet(new Set(['a', 'b']), new Set(['b', 'a']))).toBe(true);
  });
});
