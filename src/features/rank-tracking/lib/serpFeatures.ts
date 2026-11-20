import { Bot, Map as MapIcon, Quote, type LucideIcon } from 'lucide-react';
import type { SerpFeatureKey } from '../types';

/** The SERP features tracked, in the order they're shown. */
export const SERP_FEATURES: { key: SerpFeatureKey; label: string; icon: LucideIcon }[] = [
  { key: 'featuredSnippet', label: 'Featured snippet', icon: Quote },
  { key: 'localPack', label: 'Map pack', icon: MapIcon },
  { key: 'aiOverview', label: 'AI overview', icon: Bot },
];
