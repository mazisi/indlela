import { AlertOctagon, AlertTriangle, Info, type LucideIcon } from 'lucide-react';
import type { Severity } from '../types';

export const SEVERITIES: readonly Severity[] = ['critical', 'warning', 'notice'];

export const SEVERITY: Record<Severity, { label: string; plural: string; hint: string; icon: LucideIcon; text: string; soft: string; bar: string; border: string }> = {
  critical: {
    label: 'Critical',
    plural: 'Critical issues',
    hint: 'Hurting rankings or visitors now: fix first',
    icon: AlertOctagon,
    text: 'text-bad',
    soft: 'bg-bad-soft',
    bar: 'bg-bad',
    border: 'border-bad/30',
  },
  warning: {
    label: 'Warning',
    plural: 'Warnings',
    hint: 'Holding the site back: fix soon',
    icon: AlertTriangle,
    text: 'text-warn',
    soft: 'bg-warn-soft',
    bar: 'bg-warn',
    border: 'border-warn/30',
  },
  notice: {
    label: 'Notice',
    plural: 'Notices',
    hint: 'Worth a look when there is time',
    icon: Info,
    text: 'text-primary',
    soft: 'bg-accent',
    bar: 'bg-primary/60',
    border: 'border-primary/25',
  },
};
