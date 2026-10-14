/**
 * Board Master catalog types (3.0-draft1 schema)
 */

export interface StyleCatalog {
  style: string;
  draft: string;
  displayName: string;
  description: string;
  angles: { min_deg: number; max_deg: number } | null;
  steps: CatalogStep[];
  cutListAllowances: CutListAllowances;
  sizes?: string[];
  pricePerBF: number | null;  // May be null per spec
  notes?: string;
}

export interface CatalogStep {
  stepNumber: number;  // Display order only
  stepId: string;      // Stable identifier for figures and exports
  title: string;
  description: string;
  settings: Record<string, string>;
  safetyBanners: string[];
  machineSetup: string | null;
  figureType: string | null;
}

export interface CutListAllowances {
  kerf_mm: number;
  kerf_text: string;
  roughToFinalOversize_mm: {
    thickness: number;
    width: number;
    length: number;
  };
  planerMinimum_mm: {
    length: number;
    thickness: number;
  };
  jointerMinimum_mm: {
    length: number;
  };
  minPieceLength_mm: {
    planerJointer: number;
    tableSawFreehand: number;
    sledHoldDownMax: number;
  };
  flatteningAllowance_mm: number;
  sandingLoss_mm: number;
  shopDefault: boolean;  // New flag
}

/**
 * All available board styles
 */
export const BOARD_STYLES = [
  'brick-basketweave',
  'checkerboard',
  'chevron',
  'edge-grain',
  'end-grain',
  'face-grain',
  'herringbone',
  'scrap-chaotic',
  'stripe-inlay',
  'tumbling-block-3d',
] as const;

export type CatalogStyleName = typeof BOARD_STYLES[number];
