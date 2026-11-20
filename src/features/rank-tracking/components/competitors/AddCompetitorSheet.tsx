import { useEffect, type FormEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info, Loader2, Plus } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/features/auth/components/FormField';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import showToaster from '@/utils/showToaster';
import { handleApiValidationError } from '@/utils/formErrorHandler';
import { useAddCompetitor, useCompetitorSuggestions } from '../../hooks/useCompetitors';
import { MAX_COMPETITORS, isSameOrSubdomain, normaliseDomain } from '../../lib/competitors';
import { addCompetitorSchema, COMPETITOR_NAME_MAX, type AddCompetitorValues } from '../../schemas/competitorSchema';
import type { Competitor } from '../../types';
import { SuggestionList } from './SuggestionList';

interface Props {
  siteId: number;
  /** The site's address, so its own domain is refused before asking the API. */
  siteUrl: string;
  competitors: Competitor[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY: AddCompetitorValues = { domain: '', name: '' };

/** Add a competitor by domain or URL, with an optional label; suggestions from the site's results fill the domain. */
export function AddCompetitorSheet({ siteId, siteUrl, competitors, open, onOpenChange }: Props) {
  const add = useAddCompetitor(siteId);
  const suggestions = useCompetitorSuggestions(siteId, open);
  const form = useForm<AddCompetitorValues>({ resolver: zodResolver(addCompetitorSchema), defaultValues: EMPTY });
  const { errors } = form.formState;
  const domain = useWatch({ control: form.control, name: 'domain' });
  const host = normaliseDomain(domain);
  const active = competitors.filter((c) => c.isActive).length;
  const full = active >= MAX_COMPETITORS;
  const siteHost = normaliseDomain(siteUrl);
  const taken = new Set(competitors.map((c) => c.domain));

  useEffect(() => {
    if (open) form.reset(EMPTY);
  }, [open, form]);

  const onValid = async (values: AddCompetitorValues) => {
    const typed = normaliseDomain(values.domain) as string;
    if (siteHost && (isSameOrSubdomain(typed, siteHost) || isSameOrSubdomain(siteHost, typed))) {
      form.setError('domain', { message: 'That’s this site’s own domain. Add another business’s site.' });
      return;
    }
    if (taken.has(typed)) {
      form.setError('domain', { message: `${typed} is already a competitor of this site.` });
      return;
    }
    try {
      const created = await add.mutateAsync({ domain: typed, ...(values.name ? { name: values.name } : {}) });
      showToaster('success', `${created.name} added. Its positions fill in from your recent checks.`);
      onOpenChange(false);
    } catch (error) {
      handleApiValidationError(error, form.setError);
    }
  };

  // The drawer may open from inside another form; keep its submit to itself.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.stopPropagation();
    void form.handleSubmit(onValid)(e);
  };

  const ideas = (suggestions.data ?? []).filter((s) => !taken.has(s.domain));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Competitor tracking</p>
          <SheetTitle className="text-lg">Add competitor</SheetTitle>
          <SheetDescription>We track it on this site’s keywords, from the checks you already run.</SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            <p className="flex items-start gap-2 rounded border bg-muted/40 px-3 py-2 text-xs text-muted-foreground" data-testid="competitor-limit">
              <Info className="mt-px size-3.5 shrink-0" aria-hidden />
              <span>
                <span className="font-semibold tabular-nums text-foreground">
                  {active} of {MAX_COMPETITORS}
                </span>{' '}
                active competitors on this site. {full ? 'Pause or remove one to add another.' : 'Paused competitors don’t count.'}
              </span>
            </p>

            <FormField
              id="competitor-domain"
              label="Domain or URL"
              required
              error={errors.domain?.message}
              hint={host && host !== domain.trim().toLowerCase() ? `We’ll track ${host} and its subdomains.` : 'e.g. beanthere.co.za, or paste a link to any page on their site.'}
            >
              <Input
                {...fieldAria('competitor-domain', errors.domain?.message, true)}
                aria-required
                autoComplete="off"
                inputMode="url"
                placeholder="beanthere.co.za"
                disabled={full}
                {...form.register('domain')}
              />
            </FormField>

            <FormField
              id="competitor-name"
              label="Name (optional)"
              error={errors.name?.message}
              hint="How it's shown in charts and tables; the domain when left blank."
            >
              <Input {...fieldAria('competitor-name', errors.name?.message, true)} autoComplete="off" maxLength={COMPETITOR_NAME_MAX} placeholder="Bean There Coffee" disabled={full} {...form.register('name')} />
            </FormField>

            {!full && ideas.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Suggestions from your results</h3>
                <SuggestionList
                  suggestions={ideas.slice(0, 5)}
                  keywordsTotal={null}
                  renderAction={(s) => (
                    <Button type="button" variant="outline" size="sm" className="h-7" onClick={() => form.setValue('domain', s.domain, { shouldValidate: true, shouldDirty: true })} aria-label={`Use ${s.domain}`}>
                      <Plus />
                      Use
                    </Button>
                  )}
                />
              </div>
            )}
          </div>

          <SheetFooter className="flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={add.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={add.isPending || full}>
              {add.isPending && <Loader2 className="animate-spin" />}
              Add competitor
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
