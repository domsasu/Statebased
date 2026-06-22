import React from 'react';
import { RegionName } from '../config/variantLayouts';

interface RegionPlaceholderProps {
  name: RegionName;
  minHeight?: number;
}

/** Grey box shown in hi-fi when a region has no real component yet. Hidden in mid-fi (mid-fi shows its own beige block). */
export const RegionPlaceholder: React.FC<RegionPlaceholderProps> = ({ name, minHeight = 160 }) => (
  <div
    role="region"
    aria-label={name}
    style={{ minHeight }}
    className="flex items-center justify-center rounded-[var(--cds-border-radius-200)] border-2 border-dashed border-[var(--cds-color-grey-200)] bg-[var(--cds-color-grey-25)]"
  >
    <span className="cds-subtitle-sm text-[var(--cds-color-grey-400)]">{name}</span>
  </div>
);
