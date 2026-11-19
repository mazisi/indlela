import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Input } from './input';
import { displayToIso, isoToDisplay } from './date-input';

function Registered({ onValue }: { onValue: (v: string) => void }) {
  const form = useForm<{ on: string }>({ defaultValues: { on: '2026-10-07' } });
  return (
    <form onSubmit={(e) => void form.handleSubmit((v) => onValue(v.on))(e)}>
      <label htmlFor="on">On</label>
      <Input id="on" type="date" {...form.register('on')} />
      <button type="button" onClick={() => form.setValue('on', '2027-01-31')}>
        Set
      </button>
      <button type="submit">Save</button>
    </form>
  );
}

function Controlled() {
  const [on, setOn] = useState('');
  return (
    <>
      <label htmlFor="c">On</label>
      <Input id="c" type="date" value={on} onChange={(e) => setOn(e.target.value)} />
      <output>{on || 'none'}</output>
    </>
  );
}

describe('DateInput', () => {
  it('reads dates as dd/mm/yyyy and turns them into yyyy-mm-dd', () => {
    expect(isoToDisplay('2026-10-07')).toBe('07/10/2026');
    expect(isoToDisplay('')).toBe('');
    expect(displayToIso('07/10/2026')).toBe('2026-10-07');
    expect(displayToIso('7/1/2026')).toBe('2026-01-07');
    expect(displayToIso('07-10-2026')).toBe('2026-10-07');
    expect(displayToIso('07102026')).toBe('2026-10-07');
    expect(displayToIso('2026-10-07')).toBe('2026-10-07');
    expect(displayToIso('31/02/2026')).toBeNull();
    expect(displayToIso('10/2026')).toBeNull();
  });

  it('works with register: shows the default, takes a typed date and follows setValue', async () => {
    let saved = '';
    render(<Registered onValue={(v) => (saved = v)} />);
    const box = screen.getByLabelText('On');
    expect(box).toHaveValue('07/10/2026');

    await userEvent.clear(box);
    await userEvent.type(box, '15/11/2026');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(saved).toBe('2026-11-15');

    await userEvent.click(screen.getByRole('button', { name: 'Set' }));
    expect(box).toHaveValue('31/01/2027');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(saved).toBe('2027-01-31');
  });

  it('works controlled: a half-typed or impossible date is blank until it is a real date', async () => {
    render(<Controlled />);
    const box = screen.getByLabelText('On');
    await userEvent.type(box, '31/02/202');
    expect(screen.getByRole('status')).toHaveTextContent('none');
    await userEvent.clear(box);
    await userEvent.type(box, '28/02/2026');
    expect(screen.getByRole('status')).toHaveTextContent('2026-02-28');
    expect(box).toHaveValue('28/02/2026');
  });
});
