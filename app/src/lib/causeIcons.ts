import {
  GraduationCap,
  HeartPulse,
  Leaf,
  Sparkles,
  UtensilsCrossed,
  PawPrint,
  Palette,
  Users,
  Building2,
  CircleDot,
  type LucideIcon,
} from 'lucide-react';
import type { CauseBundle } from '../types';

export const CAUSE_ICONS: Record<CauseBundle, LucideIcon> = {
  Education: GraduationCap,
  Health: HeartPulse,
  Environment: Leaf,
  'Youth Development': Sparkles,
  'Food & Housing': UtensilsCrossed,
  Animals: PawPrint,
  'Arts & Culture': Palette,
  'Human Services': Users,
  'Community Improvement': Building2,
  Other: CircleDot,
};
