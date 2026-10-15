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
  features?: Features;
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
  planerMaxWidth_mm?: number;
  jointerMaxWidth_mm?: number;
  widthRule?: {
    text: string;
  };
  minPieceLength_mm: {
    planerJointer: number;
    tableSawFreehand: number;
    sledHoldDownMax: number;
  };
  flatteningAllowance_mm: number;
  sandingLoss_mm: number;
  blankRule?: {
    millWholeBlanksFirst: boolean;
    blankMinLength_mm: number;
    crosscutTrim_mm: number;
    blankMaxLength_mm?: number;
    blankUnit?: string;  // 'stripSetPanel' = glued strip-set panel
    panelMaxPlanerWidth_mm?: number;
    sledMaxWidth_mm?: number;
    panelSplitOn?: string;
    panelWideOption?: string[];  // ['routerSled', 'splitSubPanels']
    panelCrosscut?: string;  // 'crosscutSledWithStopBlock'
    panelWidthText?: string;
    panelStrips?: string;  // 'allStripsAcrossWidth' = panel is all strips across width
    sliceCount?: string;  // 'rowsAlongLength' = slice count is rows along length
    overLength?: string;  // 'splitPanels' = split into multiple panels if over max
    text: string;
  };
  shopDefault: boolean;  // New flag
}

export interface Features {
  shopDefault: boolean;
  handHole?: {
    length_mm: number;
    width_mm: number;
    endRadius_mm: number;
    edgeInset_mm: number;
    bit: string;
    text: string;
  };
  fingerGrip?: {
    length_mm: number;
    depth_mm: number;
    edgeInset_mm: number;
    bit: string;
    text: string;
  };
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
