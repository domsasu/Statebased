/**
 * Per-variant layout config — source of truth for which regions appear in each experiment.
 *
 * Each entry is an ordered list of LayoutItems. Adding an item here causes it to render
 * in BOTH mid-fi (beige block) and hi-fi (real component) for that variant.
 * Removing an item hides the region in both views.
 * Duplicating with different IDs renders that region twice.
 */

export type RegionName =
  | 'Header'
  | 'Enrolled course'
  | 'Goals and motivation'
  | 'Social Mechanisms'
  | 'Course recommendations'
  | 'Skills'
  | 'Microform content'
  | 'Career overview'
  | 'AI Search/Unblocking';

/** Regions that live in the hero grid (not draggable in white area). */
export const HERO_REGIONS: RegionName[] = ['Header', 'Enrolled course', 'Goals and motivation'];

/**
 * Number of items at the start of the layout array that belong to the hero
 * (1 Header + 2 content slots). Used for position-based classification so
 * any item can be dragged into or out of the hero slots.
 */
export const HERO_SLOT_COUNT = 3;

export interface LayoutItem {
  /** Unique ID — stable key for drag-and-drop. */
  id: string;
  /** Display name — used for aria-label and mid-fi block label. */
  name: RegionName;
}

export type VariantId = string;

export const VARIANT_LAYOUTS: Record<VariantId, LayoutItem[]> = {
  a: [
    { id: 'header', name: 'Header' },
    { id: 'enrolled-course', name: 'Enrolled course' },
    { id: 'goals-motivation', name: 'Goals and motivation' },
    { id: 'social-mechanisms', name: 'Social Mechanisms' },
    { id: 'course-recs-1', name: 'Course recommendations' },
    { id: 'trending-now', name: 'Course recommendations' },
    { id: 'in-demand-skills', name: 'Skills' },
    { id: 'microform-content', name: 'Microform content' },
  ],
  b: [
    { id: 'header', name: 'Header' },
    { id: 'enrolled-course', name: 'Enrolled course' },
    { id: 'goals-motivation', name: 'Goals and motivation' },
    { id: 'social-mechanisms', name: 'Social Mechanisms' },
    { id: 'course-recs-1', name: 'Course recommendations' },
    { id: 'trending-now', name: 'Course recommendations' },
    { id: 'in-demand-skills', name: 'Skills' },
    { id: 'career-overview', name: 'Career overview' },
    { id: 'ai-search-overview', name: 'AI Search/Unblocking' },
  ],
  c: [
    { id: 'header', name: 'Header' },
    { id: 'enrolled-course', name: 'Enrolled course' },
    { id: 'goals-motivation', name: 'Goals and motivation' },
    { id: 'social-mechanisms', name: 'Social Mechanisms' },
    { id: 'course-recs-1', name: 'Course recommendations' },
    { id: 'trending-now', name: 'Course recommendations' },
    { id: 'in-demand-skills', name: 'Skills' },
    { id: 'microform-content', name: 'Microform content' },
    { id: 'career-overview', name: 'Career overview' },
    { id: 'ai-search-overview', name: 'AI Search/Unblocking' },
  ],
  d: [
    { id: 'header', name: 'Header' },
    { id: 'enrolled-course', name: 'Enrolled course' },
    { id: 'goals-motivation', name: 'Goals and motivation' },
    { id: 'social-mechanisms', name: 'Social Mechanisms' },
    { id: 'course-recs-1', name: 'Course recommendations' },
    { id: 'trending-now', name: 'Course recommendations' },
    { id: 'in-demand-skills', name: 'Skills' },
    { id: 'microform-content', name: 'Microform content' },
    { id: 'career-overview', name: 'Career overview' },
    { id: 'ai-search-overview', name: 'AI Search/Unblocking' },
  ],
};
