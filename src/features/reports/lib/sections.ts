import { ScanSearch, Search, TrendingUp, type LucideIcon } from 'lucide-react';
import type { ReportCompare, ReportSection } from '../types';

export const SECTIONS: readonly { key: ReportSection; label: string; hint: string; icon: LucideIcon }[] = [
  { key: 'search_console', label: 'Search Console', hint: 'Clicks, impressions, top searches and pages, quick wins', icon: Search },
  { key: 'rank_tracking', label: 'Rank tracking', hint: 'Positions, keywords that entered the top 10, gains and drops', icon: TrendingUp },
  { key: 'site_audit', label: 'Site audit', hint: 'Health score, issues fixed and new, what to fix next', icon: ScanSearch },
];

export const ALL_SECTIONS: ReportSection[] = SECTIONS.map((s) => s.key);

export const sectionLabel = (key: ReportSection) => SECTIONS.find((s) => s.key === key)?.label ?? key;

export const COMPARE_OPTIONS: readonly { value: ReportCompare; label: string }[] = [
  { value: 'previous', label: 'Previous period' },
  { value: 'year', label: 'Same period last year' },
  { value: 'none', label: "Don't compare" },
];

export const compareLabel = (value: ReportCompare) => COMPARE_OPTIONS.find((o) => o.value === value)?.label ?? value;
