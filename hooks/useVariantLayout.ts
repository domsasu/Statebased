import { useCallback } from 'react';
import { HERO_SLOT_COUNT, LayoutItem, RegionName } from '../config/variantLayouts';
import { useLayoutOrder } from '../context/LayoutOrderContext';
import { usePrototypeExperiment } from '../context/PrototypeExperimentContext';

export function useVariantLayout() {
  const { experiment } = usePrototypeExperiment();
  const { getLayout, reorder } = useLayoutOrder();
  const layout = getLayout(experiment);

  const shows = useCallback(
    (id: string) => layout.some((item) => item.id === id),
    [layout],
  );

  const showsRegion = useCallback(
    (name: RegionName) => layout.some((item) => item.name === name),
    [layout],
  );

  /**
   * Hero content items: positions 1 and 2 in the layout array (position 0 is always Header).
   * Position-based so any item can be dragged into the hero slots.
   */
  const heroContentItems: LayoutItem[] = layout.slice(1, HERO_SLOT_COUNT);

  /** Items in the scrollable white area below the hero. */
  const whiteAreaItems: LayoutItem[] = layout.slice(HERO_SLOT_COUNT);

  const reorderWhiteArea = useCallback(
    (newItems: LayoutItem[]) => {
      reorder(experiment, [...layout.slice(0, HERO_SLOT_COUNT), ...newItems]);
    },
    [experiment, layout, reorder],
  );

  /** Swap the two hero content slots (e.g. Enrolled course ↔ Goals and motivation). */
  const swapHeroContent = useCallback(
    (newItems: LayoutItem[]) => {
      reorder(experiment, [layout[0], ...newItems, ...layout.slice(HERO_SLOT_COUNT)]);
    },
    [experiment, layout, reorder],
  );

  /**
   * Swap a hero content slot with a white area item.
   * Preserves relative order of all other items.
   */
  const swapHeroAndWhite = useCallback(
    (heroItem: LayoutItem, whiteItem: LayoutItem) => {
      const newLayout = [...layout];
      const heroIdx = newLayout.findIndex((i) => i.id === heroItem.id);
      const whiteIdx = newLayout.findIndex((i) => i.id === whiteItem.id);
      if (heroIdx === -1 || whiteIdx === -1) return;
      [newLayout[heroIdx], newLayout[whiteIdx]] = [newLayout[whiteIdx], newLayout[heroIdx]];
      reorder(experiment, newLayout);
    },
    [experiment, layout, reorder],
  );

  return { shows, showsRegion, layout, whiteAreaItems, heroContentItems, reorderWhiteArea, swapHeroContent, swapHeroAndWhite, experiment };
}
