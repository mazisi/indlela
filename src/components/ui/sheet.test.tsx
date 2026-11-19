import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './sheet';
import { Checkbox } from './checkbox';

function Drawer({ onClose }: { onClose: (open: boolean) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        onClose(o);
      }}
    >
      <SheetContent>
        <SheetTitle>Add a bank</SheetTitle>
        <SheetDescription>A drawer with a form.</SheetDescription>
        <label>
          Name <input />
        </label>
        <input type="search" aria-label="Search" />
        <Checkbox aria-label="Active" />
      </SheetContent>
    </Sheet>
  );
}

const drawer = () => screen.getByRole('dialog', { name: 'Add a bank' });

describe('SheetContent and Escape', () => {
  it('closes like Cancel when nothing was changed, also after typing in a search box', async () => {
    const onOpenChange = vi.fn();
    render(<Drawer onClose={onOpenChange} />);

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search' }), 'abc');
    await userEvent.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Add a bank' })).not.toBeInTheDocument());
  });

  it('asks before throwing away what was typed: Keep editing stays, Discard closes', async () => {
    const onOpenChange = vi.fn();
    render(<Drawer onClose={onOpenChange} />);

    await userEvent.type(within(drawer()).getByLabelText('Name'), 'Absa');
    await userEvent.keyboard('{Escape}');
    const ask = await screen.findByRole('alertdialog', { name: 'Discard your changes?' });
    await userEvent.click(within(ask).getByRole('button', { name: 'Keep editing' }));

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(within(drawer()).getByLabelText('Name')).toHaveValue('Absa');

    await userEvent.keyboard('{Escape}');
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('counts ticking a box as a change', async () => {
    const onOpenChange = vi.fn();
    render(<Drawer onClose={onOpenChange} />);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Active' }));
    await userEvent.keyboard('{Escape}');

    expect(await screen.findByRole('alertdialog', { name: 'Discard your changes?' })).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
