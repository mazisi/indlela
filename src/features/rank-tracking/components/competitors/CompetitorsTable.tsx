import { useState } from 'react';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { DataTable } from '@/components/table/DataTable';
import showToaster from '@/utils/showToaster';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useDeleteCompetitor, useUpdateCompetitor } from '../../hooks/useCompetitors';
import type { Competitor } from '../../types';
import { CompetitorRowMenu } from './CompetitorRowMenu';
import { RenameCompetitorSheet } from './RenameCompetitorSheet';
import { competitorColumns } from './competitorColumns';

interface Props {
  siteId: number;
  competitors: Competitor[];
  colors: Map<number, string>;
  canManage: boolean;
}

/** The site's competitors with their standing; managers rename, pause/resume and remove from the row menu. */
export function CompetitorsTable({ siteId, competitors, colors, canManage }: Props) {
  const update = useUpdateCompetitor(siteId);
  const remove = useDeleteCompetitor(siteId);
  const [renaming, setRenaming] = useState<Competitor>();
  const [removing, setRemoving] = useState<Competitor>();

  const toggleActive = (c: Competitor) =>
    update.mutate(
      { id: c.id, update: { isActive: !c.isActive } },
      {
        onSuccess: () => showToaster('success', c.isActive ? `${c.name} is paused: it's left out of share of voice and alerts.` : `${c.name} is tracked again.`),
        onError: (error) => showToaster('error', getApiErrorMessage(error, `Could not ${c.isActive ? 'pause' : 'resume'} ${c.name}.`)),
      },
    );

  const confirmRemove = () =>
    removing &&
    remove.mutate(removing.id, {
      onSuccess: () => {
        showToaster('success', `${removing.name} is no longer tracked.`);
        setRemoving(undefined);
      },
      onError: (error) => showToaster('error', getApiErrorMessage(error, 'Could not remove the competitor.')),
    });

  return (
    <>
      <DataTable
        rows={competitors}
        columns={competitorColumns(colors)}
        rowLabel={(c) => c.name}
        noun="competitors"
        muted={(c) => !c.isActive}
        actions={
          canManage
            ? {
                extra: (c) => (
                  <CompetitorRowMenu
                    competitor={c}
                    busy={update.isPending && update.variables?.id === c.id}
                    onRename={() => setRenaming(c)}
                    onToggleActive={() => toggleActive(c)}
                    onRemove={() => setRemoving(c)}
                  />
                ),
              }
            : undefined
        }
      />
      {canManage && (
        <>
          <RenameCompetitorSheet siteId={siteId} competitor={renaming} onClose={() => setRenaming(undefined)} />
          <ConfirmationDialog
            open={Boolean(removing)}
            onOpenChange={(o) => !o && setRemoving(undefined)}
            title="Remove this competitor?"
            description={removing && `${removing.name} (${removing.domain}) leaves share of voice, the head-to-head and alerts. You can add it again later.`}
            confirmLabel="Remove"
            variant="danger"
            isLoading={remove.isPending}
            onConfirm={confirmRemove}
          />
        </>
      )}
    </>
  );
}
