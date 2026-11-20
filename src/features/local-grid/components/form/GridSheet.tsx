import { useEffect, type FormEvent } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Lock, MapPin } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Segmented } from '@/components/form/Segmented';
import { SwitchRow } from '@/components/form/SwitchRow';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { FormField } from '@/features/auth/components/FormField';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import showToaster from '@/utils/showToaster';
import { handleApiValidationError } from '@/utils/formErrorHandler';
import { useCreateGrid, useLocalGridUsage, useUpdateGrid } from '../../hooks/useLocalGrid';
import { rootFieldErrors } from '../../lib/errors';
import { DEFAULT_SIZE, DEFAULT_SPACING, DEVICE_LABEL, GRID_SIZES, SPACINGS, formatKm, sizeLabel } from '../../lib/labels';
import { gridsFull, scanNowBlocked } from '../../lib/usage';
import { gridSchema, type GridFormValues } from '../../schemas/gridSchema';
import type { Grid, GridDevice, GridSize, SpacingKm } from '../../types';
import { BusinessSearch } from './BusinessSearch';
import { GridArea } from './GridArea';
import { ScheduleChoice } from './ScheduleChoice';

interface Props {
  siteId: number;
  siteName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Editing this grid; absent = a new grid. */
  grid?: Grid;
  onCreated?: (grid: Grid) => void;
}

const toForm = (grid?: Grid): GridFormValues =>
  grid
    ? {
        keyword: grid.keyword,
        business: grid.business,
        centerLat: grid.centerLat,
        centerLng: grid.centerLng,
        size: grid.size,
        spacingKm: grid.spacingKm as SpacingKm,
        device: grid.device,
        schedule: grid.schedule,
        scanNow: false,
        isActive: grid.isActive,
      }
    : { keyword: '', business: null, centerLat: null, centerLng: null, size: DEFAULT_SIZE, spacingKm: DEFAULT_SPACING, device: 'mobile', schedule: 'none', scanNow: true, isActive: true };

const SIZE_OPTIONS = GRID_SIZES.map((s) => [String(s), `${sizeLabel(s)} · ${s * s}`] as const);
const DEVICE_OPTIONS = (['mobile', 'desktop'] as const).map((d) => [d, DEVICE_LABEL[d]] as const);
/** Laravel's snake_case names → the form's fields (the rest camelise by themselves). */
const FIELD_MAP = { center_lat: 'centerLat', center_lng: 'centerLng', spacing_km: 'spacingKm', scan_now: 'scanNow', is_active: 'isActive' } as const;

/**
 * Create or edit a local grid: the keyword, the business's Maps listing
 * (searched; locked on edit), the area on a map preview, size, spacing,
 * device, schedule, and on create whether to scan right away.
 */
export function GridSheet({ siteId, siteName, open, onOpenChange, grid, onCreated }: Props) {
  const editing = Boolean(grid);
  const create = useCreateGrid(siteId);
  const update = useUpdateGrid(siteId);
  const usage = useLocalGridUsage();
  const form = useForm<GridFormValues>({ resolver: zodResolver(gridSchema), defaultValues: toForm(grid) });
  const { errors } = form.formState;
  const [business, centerLat, centerLng, size, spacingKm] = useWatch({ control: form.control, name: ['business', 'centerLat', 'centerLng', 'size', 'spacingKm'] });
  const center = centerLat !== null && centerLng !== null ? { lat: centerLat, lng: centerLng } : null;
  const full = !editing && gridsFull(usage.data);
  const scanBlocked = scanNowBlocked(usage.data);
  const pending = create.isPending || update.isPending;

  useEffect(() => {
    if (open) form.reset(toForm(grid));
  }, [open, grid, form]);

  const moveCenter = (c: { lat: number; lng: number }) => {
    form.setValue('centerLat', c.lat, { shouldDirty: true });
    form.setValue('centerLng', c.lng, { shouldDirty: true });
    form.clearErrors(['centerLat', 'centerLng']);
  };

  const onValid = async (values: GridFormValues) => {
    if (!values.business || values.centerLat === null || values.centerLng === null) return;
    const shape = {
      keyword: values.keyword.trim(),
      centerLat: values.centerLat,
      centerLng: values.centerLng,
      size: values.size as GridSize,
      spacingKm: values.spacingKm as SpacingKm,
      device: values.device as GridDevice,
      schedule: values.schedule,
    };
    try {
      if (grid) {
        await update.mutateAsync({ id: grid.id, update: { ...shape, isActive: values.isActive } });
        showToaster('success', `“${shape.keyword}” saved.`);
        onOpenChange(false);
        return;
      }
      const b = values.business;
      const scanNow = values.scanNow && !scanBlocked;
      const { grid: created, scanError } = await create.mutateAsync({
        ...shape,
        business: { title: b.title, lat: b.lat, lng: b.lng, ...(b.placeId ? { placeId: b.placeId } : {}), ...(b.cid ? { cid: b.cid } : {}), ...(b.address ? { address: b.address } : {}) },
        scanNow,
      });
      if (scanError) showToaster('default', `Grid saved. ${scanError.message}`);
      else showToaster('success', scanNow ? `“${created.keyword}” created. The first scan is on its way.` : `“${created.keyword}” created.`);
      onOpenChange(false);
      onCreated?.(created);
    } catch (error) {
      handleApiValidationError(rootFieldErrors(error), form.setError, FIELD_MAP);
    }
  };

  // The drawer may be opened from inside another form: keep its submit to itself.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.stopPropagation();
    void form.handleSubmit(onValid)(e);
  };

  const areaError = errors.centerLat?.message ?? errors.centerLng?.message;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-xl">
        <SheetHeader className="border-b">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Local grid · {siteName}</p>
          <SheetTitle className="text-lg">{editing ? 'Edit grid' : 'New grid'}</SheetTitle>
          <SheetDescription>
            {editing ? 'Change the search, the area or the schedule. The business stays: a different one needs a new grid.' : 'We search from every point of the grid and show where the business appears in the map pack.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            {full && usage.data && (
              <FormAlert tone="warning">
                <p>
                  This workspace has {usage.data.grids.used} of {usage.data.grids.limit} active grids. Pause or delete one to make room.
                </p>
              </FormAlert>
            )}

            <FormField id="grid-keyword" label="Keyword" error={errors.keyword?.message} required hint="The search to check, as customers type it, e.g. coffee shop or plumber near me.">
              <Input {...fieldAria('grid-keyword', errors.keyword?.message, true)} aria-required autoComplete="off" placeholder="coffee shop" {...form.register('keyword')} />
            </FormField>

            {editing && business ? (
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground">Business</p>
                <div className="flex items-start gap-3 rounded border bg-muted/30 p-3" data-testid="locked-business">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{business.title}</p>
                    {business.address && <p className="truncate text-xs text-muted-foreground">{business.address}</p>}
                  </div>
                  <Lock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-label="Locked" />
                </div>
              </div>
            ) : (
              <Controller
                control={form.control}
                name="business"
                render={({ field }) => (
                  <BusinessSearch
                    siteId={siteId}
                    value={field.value}
                    usage={usage.data}
                    error={errors.business?.message}
                    onChange={(b) => {
                      field.onChange(b);
                      form.clearErrors('business');
                      if (b) moveCenter({ lat: b.lat, lng: b.lng });
                      else {
                        form.setValue('centerLat', null);
                        form.setValue('centerLng', null);
                      }
                    }}
                  />
                )}
              />
            )}

            <GridArea center={center} size={size} spacingKm={spacingKm} business={business} onCenterChange={moveCenter} error={areaError} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p id="grid-size-label" className="text-sm font-medium text-foreground">
                  Grid size
                </p>
                <Controller
                  control={form.control}
                  name="size"
                  render={({ field }) => <Segmented label="Grid size" value={String(field.value)} onChange={(v) => field.onChange(Number(v) as GridSize)} options={SIZE_OPTIONS} />}
                />
                <p className="text-xs text-muted-foreground">Points across × down, and how many.</p>
              </div>
              <FormField id="grid-spacing" label="Spacing" error={errors.spacingKm?.message} hint="Distance between neighbouring points.">
                <Controller
                  control={form.control}
                  name="spacingKm"
                  render={({ field }) => (
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v) as SpacingKm)}>
                      <SelectTrigger {...fieldAria('grid-spacing', errors.spacingKm?.message, true)} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SPACINGS.map((s) => (
                          <SelectItem key={s} value={String(s)}>
                            {formatKm(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium text-foreground">Device</p>
              <Controller control={form.control} name="device" render={({ field }) => <Segmented label="Device" value={field.value} onChange={field.onChange} options={DEVICE_OPTIONS} />} />
              <p className="text-xs text-muted-foreground">Most local searches happen on phones.</p>
            </div>

            <Controller control={form.control} name="schedule" render={({ field }) => <ScheduleChoice value={field.value} onChange={field.onChange} error={errors.schedule?.message} />} />

            {editing ? (
              <>
                <SwitchRow label="Active" hint="Paused grids aren't scanned and don't count towards your grid limit; their scans are kept.">
                  {({ id, hintId }) => (
                    <Controller control={form.control} name="isActive" render={({ field }) => <Switch id={id} aria-describedby={hintId} checked={field.value} onCheckedChange={field.onChange} />} />
                  )}
                </SwitchRow>
                {errors.isActive && (
                  <p role="alert" className="-mt-3 text-xs text-destructive">
                    {errors.isActive.message}
                  </p>
                )}
              </>
            ) : (
              <Controller
                control={form.control}
                name="scanNow"
                render={({ field }) => (
                  <label htmlFor="grid-scan-now" className="flex cursor-pointer items-start gap-3 rounded border bg-muted/30 p-3">
                    <Checkbox id="grid-scan-now" checked={field.value && !scanBlocked} disabled={Boolean(scanBlocked)} onCheckedChange={(v) => field.onChange(v === true)} className="mt-0.5" aria-describedby="grid-scan-now-hint" />
                    <span>
                      <span className="block text-sm font-medium">Scan as soon as it's saved</span>
                      <span id="grid-scan-now-hint" className="block text-xs text-muted-foreground">
                        {scanBlocked ??
                          (usage.data ? `Uses one of today's scans (${usage.data.scansToday.used} of ${usage.data.scansToday.limit} used). Results in about a minute.` : 'Results in about a minute.')}
                      </span>
                    </span>
                  </label>
                )}
              />
            )}
          </div>

          <SheetFooter className="flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || full}>
              {pending && <Loader2 className="animate-spin" />}
              {editing ? 'Save changes' : 'Create grid'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

